const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildPrompt(boxType) {
  const isP = boxType === 'premium';
  return `당신은 한국 랜덤박스 앱의 상품 생성 AI입니다.
${isP ? '프리미엄(10,000원)' : '스타터(5,000원)'} 박스에서 나올 상품 1개를 생성하세요.

아래 JSON만 응답하세요 (다른 텍스트 없이):
{
  "name": "상품명 (한국어, 실제 상품처럼)",
  "price": 가격(숫자, 원 단위),
  "rarity": "일반|고급|희귀|영웅|전설 중 하나",
  "description": "상품 설명 (한국어, 1문장)",
  "emoji": "관련 이모지 1개",
  "category": "카테고리"
}

가격 및 등급 가이드:
- 일반(50%): ${isP ? '10,000~30,000' : '5,000~15,000'}원
- 고급(25%): ${isP ? '30,000~150,000' : '15,000~80,000'}원
- 희귀(15%): ${isP ? '150,000~500,000' : '80,000~300,000'}원
- 영웅(8%): ${isP ? '500,000~1,500,000' : '300,000~700,000'}원
- 전설(2%): ${isP ? '1,500,000~3,000,000' : '700,000~1,500,000'}원

카테고리 예시: 전자기기, 명품패션, 뷰티, 식품/음료, 스포츠, 게임, 여행, 생활용품
매번 다양하고 흥미로운 상품을 창의적으로 만들어주세요.`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/open-box' && request.method === 'POST') {
      try {
        const { boxType = 'starter' } = await request.json();

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 512,
            messages: [{ role: 'user', content: buildPrompt(boxType) }],
          }),
        });

        if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);

        const data = await res.json();
        const text = data.content[0].text.trim();
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('JSON 파싱 실패');

        const item = JSON.parse(match[0]);
        item.id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        item.openedAt = new Date().toISOString();
        item.boxType = boxType;

        return new Response(JSON.stringify(item), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
};
