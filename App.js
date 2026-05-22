import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  Animated, SafeAreaView, StatusBar, Alert,
} from 'react-native';

const API_URL = 'https://dreambox.09sheis.workers.dev';

const C = {
  bg: '#0a0a0f',
  card: '#1a1a2e',
  cardLight: '#16213e',
  gold: '#FFD700',
  white: '#FFFFFF',
  gray: '#666',
  일반: '#9E9E9E',
  고급: '#4CAF50',
  희귀: '#2196F3',
  영웅: '#9C27B0',
  전설: '#FF6B00',
};

const BOXES = [
  { id: 'starter', name: 'STARTER BOX', price: 5000, range: '5천원 ~ 150만원', emoji: '📦', color: '#4CAF50' },
  { id: 'premium', name: 'PREMIUM BOX', price: 10000, range: '1만원 ~ 300만원', emoji: '🎁', color: C.gold, badge: 'HOT' },
];

const FALLBACK = {
  starter: [
    { name: '스타벅스 아메리카노 2잔', price: 9500, rarity: '일반', emoji: '☕', description: '진한 에스프레소의 향긋한 아침', category: '식음료' },
    { name: '배달의민족 1만원 쿠폰', price: 10000, rarity: '고급', emoji: '🛵', description: '오늘 저녁 맛집 배달 한방!', category: '식음료' },
    { name: '나이키 후드티', price: 89000, rarity: '희귀', emoji: '👕', description: '클래식 스우시 로고 후디', category: '패션' },
    { name: '무선 블루투스 이어폰', price: 45000, rarity: '고급', emoji: '🎧', description: '6시간 연속 재생 무선 이어폰', category: '전자기기' },
    { name: '닌텐도 스위치 게임 1종', price: 59000, rarity: '희귀', emoji: '🎮', description: '최신 닌텐도 타이틀', category: '게임' },
    { name: '아이패드 에어 M2', price: 990000, rarity: '영웅', emoji: '📱', description: '애플 최신 아이패드 에어', category: '전자기기' },
    { name: '맥북 프로 M4', price: 2990000, rarity: '전설', emoji: '💻', description: '꿈의 맥북', category: '전자기기' },
  ],
  premium: [
    { name: 'MacBook Air M3', price: 1590000, rarity: '전설', emoji: '💻', description: '애플 최신 맥북 에어 M3 칩', category: '전자기기' },
    { name: 'AirPods Pro 2세대', price: 359000, rarity: '영웅', emoji: '🎧', description: '액티브 노이즈캔슬링 에어팟', category: '전자기기' },
    { name: '발렌시아가 트랙 2 스니커즈', price: 890000, rarity: '영웅', emoji: '👟', description: '명품 하이테크 러닝화', category: '명품패션' },
    { name: '나이키 에어맥스 270', price: 169000, rarity: '희귀', emoji: '👟', description: '최대 에어 유닛 쿠셔닝', category: '스포츠' },
    { name: '설화수 윤조에센스', price: 78000, rarity: '고급', emoji: '🧴', description: '한국 대표 럭셔리 스킨케어', category: '뷰티' },
    { name: '다이슨 에어랩', price: 699000, rarity: '영웅', emoji: '💨', description: '세계 최고의 헤어 스타일러', category: '뷰티' },
    { name: 'PS5 + 게임 3종', price: 980000, rarity: '전설', emoji: '🕹️', description: '플스5 본체 + 최신 타이틀 3개', category: '게임' },
  ],
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [balance, setBalance] = useState(50000);
  const [inventory, setInventory] = useState([]);
  const [shippingList, setShippingList] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [openedItem, setOpenedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealScale = useRef(new Animated.Value(0.7)).current;

  const startShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]),
      { iterations: 5 }
    ).start();
  }, [shakeAnim]);

  const startReveal = useCallback(() => {
    revealOpacity.setValue(0);
    revealScale.setValue(0.7);
    Animated.parallel([
      Animated.spring(revealScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(revealOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.15, friction: 4, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
    ]).start();
  }, [revealOpacity, revealScale, scaleAnim]);

  const openBox = useCallback(async (box) => {
    if (balance < box.price) {
      Alert.alert('잔액 부족', '캐시가 부족해요. 충전 후 이용해주세요.');
      return;
    }
    setBalance(b => b - box.price);
    setSelectedBox(box);
    setOpenedItem(null);
    setLoading(true);
    setScreen('opening');
    startShake();

    try {
      const res = await fetch(`${API_URL}/open-box`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boxType: box.id }),
      });
      if (!res.ok) throw new Error('API 오류');
      const item = await res.json();
      if (item.error) throw new Error(item.error);
      setTimeout(() => { setLoading(false); setOpenedItem(item); startReveal(); }, 1800);
    } catch {
      const base = getRandom(FALLBACK[box.id]);
      const item = { ...base, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, openedAt: new Date().toISOString() };
      setTimeout(() => { setLoading(false); setOpenedItem(item); startReveal(); }, 1800);
    }
  }, [balance, startShake, startReveal]);

  const collect = useCallback(() => {
    if (!openedItem) return;
    setInventory(prev => [openedItem, ...prev]);
    setScreen('inventory');
  }, [openedItem]);

  const requestShip = useCallback((item) => {
    Alert.alert('배송 신청', `${item.name}\n\n3~5일 내 배송됩니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '신청하기', onPress: () => {
        setInventory(prev => prev.filter(i => i.id !== item.id));
        setShippingList(prev => [{ ...item, status: '배송준비중', requestedAt: new Date().toISOString() }, ...prev]);
      }},
    ]);
  }, []);

  // ── Screens ──────────────────────────────────────────────────────────────────

  function HomeScreen() {
    return (
      <ScrollView style={s.screen} showsVerticalScrollIndicator={false}>
        <View style={s.topBar}>
          <Text style={s.logo}>✦ DREAMBOX</Text>
          <View style={s.balancePill}>
            <Text style={s.balanceText}>💰 {balance.toLocaleString()}원</Text>
          </View>
        </View>
        <Text style={s.subtitle}>AI가 선택하는 나만의 특별한 상품</Text>

        {BOXES.map(box => (
          <TouchableOpacity key={box.id} style={[s.boxCard, { borderColor: box.color }]} onPress={() => openBox(box)} activeOpacity={0.85}>
            {box.badge && <View style={s.hotBadge}><Text style={s.hotText}>{box.badge}</Text></View>}
            <Text style={s.boxEmoji}>{box.emoji}</Text>
            <Text style={[s.boxName, { color: box.color }]}>{box.name}</Text>
            <Text style={s.boxRange}>{box.range}</Text>
            <View style={[s.buyBtn, { backgroundColor: box.color }]}>
              <Text style={s.buyBtnText}>박스 열기 · {box.price.toLocaleString()}원</Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.chargeBtn} onPress={() => setBalance(b => b + 30000)}>
          <Text style={s.chargeText}>⚡ 캐시 충전 +30,000원</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    );
  }

  function OpeningScreen() {
    return (
      <View style={s.openingWrap}>
        <TouchableOpacity style={s.backBtn} onPress={() => { setBalance(b => b + (selectedBox?.price || 0)); setScreen('home'); }}>
          <Text style={s.backText}>← 취소</Text>
        </TouchableOpacity>

        <Animated.View style={[s.bigBox, { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }]}>
          <Text style={s.bigEmoji}>{selectedBox?.emoji}</Text>
          <Text style={[s.bigName, { color: selectedBox?.color }]}>{selectedBox?.name}</Text>
        </Animated.View>

        {loading && (
          <View style={s.loadingBox}>
            <Text style={s.loadingText}>🤖 AI가 상품을 고르는 중...</Text>
            <Text style={s.loadingSub}>Claude가 특별한 상품을 선택하고 있어요</Text>
          </View>
        )}

        {!loading && openedItem && (
          <Animated.View style={[s.revealWrap, { opacity: revealOpacity, transform: [{ scale: revealScale }] }]}>
            <View style={[s.itemCard, { borderColor: C[openedItem.rarity] || C.gold }]}>
              <View style={[s.rarityTag, { backgroundColor: C[openedItem.rarity] || C.gold }]}>
                <Text style={s.rarityText}>★ {openedItem.rarity}</Text>
              </View>
              <Text style={s.revealEmoji}>{openedItem.emoji}</Text>
              <Text style={s.revealName}>{openedItem.name}</Text>
              <Text style={s.revealDesc}>{openedItem.description}</Text>
              <Text style={[s.revealPrice, { color: C[openedItem.rarity] || C.gold }]}>
                ₩{openedItem.price?.toLocaleString()}
              </Text>
              {openedItem.category && <Text style={s.categoryTag}># {openedItem.category}</Text>}
            </View>
            <TouchableOpacity style={s.collectBtn} onPress={collect}>
              <Text style={s.collectText}>보관함에 저장 →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.againBtn} onPress={() => openBox(selectedBox)}>
              <Text style={s.againText}>한번 더 열기</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }

  function InventoryScreen() {
    return (
      <View style={s.screen}>
        <View style={s.screenHeader}>
          <Text style={s.screenTitle}>🎒 보관함</Text>
          <Text style={s.countBadge}>{inventory.length}개</Text>
        </View>
        {inventory.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>보관함이 비어있어요</Text>
            <TouchableOpacity onPress={() => setScreen('home')}>
              <Text style={s.emptyLink}>박스 열러 가기 →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {inventory.map(item => (
              <View key={item.id} style={[s.invCard, { borderLeftColor: C[item.rarity] || C.gray }]}>
                <Text style={s.invEmoji}>{item.emoji}</Text>
                <View style={s.invMeta}>
                  <Text style={[s.invRarity, { color: C[item.rarity] || C.gray }]}>{item.rarity}</Text>
                  <Text style={s.invName}>{item.name}</Text>
                  <Text style={s.invPrice}>₩{item.price?.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={s.shipTagBtn} onPress={() => requestShip(item)}>
                  <Text style={s.shipTagText}>배송신청</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    );
  }

  function ShippingScreen() {
    return (
      <View style={s.screen}>
        <View style={s.screenHeader}>
          <Text style={s.screenTitle}>🚚 배송현황</Text>
        </View>
        {shippingList.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📦</Text>
            <Text style={s.emptyText}>배송 중인 상품이 없어요</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {shippingList.map((item, i) => (
              <View key={i} style={s.shipCard}>
                <Text style={s.shipEmoji}>{item.emoji}</Text>
                <View style={s.shipMeta}>
                  <Text style={s.shipName}>{item.name}</Text>
                  <View style={s.statusRow}>
                    <View style={s.statusDot} />
                    <Text style={s.statusText}>{item.status}</Text>
                  </View>
                  <Text style={s.shipEta}>예상 배송: 3~5일 이내</Text>
                </View>
                <Text style={[s.invRarity, { color: C[item.rarity] || C.gray }]}>{item.rarity}</Text>
              </View>
            ))}
            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    );
  }

  const TABS = [
    { id: 'home', icon: '🏠', label: '홈' },
    { id: 'inventory', icon: '🎒', label: inventory.length ? `보관함 ${inventory.length}` : '보관함' },
    { id: 'shipping', icon: '🚚', label: '배송' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={{ flex: 1 }}>
        {screen === 'home' && <HomeScreen />}
        {screen === 'opening' && <OpeningScreen />}
        {screen === 'inventory' && <InventoryScreen />}
        {screen === 'shipping' && <ShippingScreen />}
      </View>
      {screen !== 'opening' && (
        <View style={s.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.id} style={s.tab} onPress={() => setScreen(tab.id)}>
              <Text style={s.tabIcon}>{tab.icon}</Text>
              <Text style={[s.tabLabel, screen === tab.id && s.tabActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1, paddingHorizontal: 16 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingBottom: 4 },
  logo: { fontSize: 22, fontWeight: 'bold', color: C.gold, letterSpacing: 3 },
  balancePill: { backgroundColor: C.card, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.gold },
  balanceText: { color: C.gold, fontWeight: 'bold', fontSize: 13 },
  subtitle: { color: C.gray, fontSize: 13, marginTop: 4, marginBottom: 20 },

  boxCard: { backgroundColor: C.card, borderRadius: 18, padding: 24, marginBottom: 14, borderWidth: 1.5, alignItems: 'center', position: 'relative' },
  hotBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  hotText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  boxEmoji: { fontSize: 64, marginBottom: 8 },
  boxName: { fontSize: 20, fontWeight: 'bold', letterSpacing: 2, marginBottom: 4 },
  boxRange: { color: C.gray, fontSize: 13, marginBottom: 18 },
  buyBtn: { paddingHorizontal: 28, paddingVertical: 13, borderRadius: 30, width: '100%', alignItems: 'center' },
  buyBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
  chargeBtn: { backgroundColor: C.cardLight, borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  chargeText: { color: C.white, fontSize: 15 },

  openingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backBtn: { position: 'absolute', top: 20, left: 20 },
  backText: { color: C.gray, fontSize: 15 },
  bigBox: { alignItems: 'center', marginBottom: 36 },
  bigEmoji: { fontSize: 110, marginBottom: 12 },
  bigName: { fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  loadingBox: { alignItems: 'center' },
  loadingText: { color: C.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  loadingSub: { color: C.gray, fontSize: 13 },

  revealWrap: { width: '100%', alignItems: 'center' },
  itemCard: { backgroundColor: C.card, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', borderWidth: 2, marginBottom: 14 },
  rarityTag: { paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, marginBottom: 14 },
  rarityText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  revealEmoji: { fontSize: 72, marginBottom: 10 },
  revealName: { color: C.white, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  revealDesc: { color: C.gray, textAlign: 'center', fontSize: 13, marginBottom: 10 },
  revealPrice: { fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  categoryTag: { color: C.gray, fontSize: 12 },
  collectBtn: { backgroundColor: C.gold, paddingVertical: 14, borderRadius: 30, width: '100%', alignItems: 'center', marginBottom: 10 },
  collectText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  againBtn: { borderWidth: 1, borderColor: '#444', paddingVertical: 14, borderRadius: 30, width: '100%', alignItems: 'center' },
  againText: { color: C.white, fontSize: 15 },

  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, paddingBottom: 16 },
  screenTitle: { color: C.white, fontSize: 20, fontWeight: 'bold' },
  countBadge: { color: C.gray, fontSize: 15 },

  invCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4 },
  invEmoji: { fontSize: 38, marginRight: 12 },
  invMeta: { flex: 1 },
  invRarity: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  invName: { color: C.white, fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  invPrice: { color: C.gray, fontSize: 13 },
  shipTagBtn: { backgroundColor: C.gold, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  shipTagText: { color: '#000', fontWeight: 'bold', fontSize: 12 },

  shipCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  shipEmoji: { fontSize: 38, marginRight: 12 },
  shipMeta: { flex: 1 },
  shipName: { color: C.white, fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4CAF50', marginRight: 6 },
  statusText: { color: '#4CAF50', fontSize: 13, fontWeight: 'bold' },
  shipEta: { color: C.gray, fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 14 },
  emptyText: { color: C.gray, fontSize: 17, marginBottom: 12 },
  emptyLink: { color: C.gold, fontSize: 15 },

  tabBar: { flexDirection: 'row', backgroundColor: C.card, paddingBottom: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#222' },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22, marginBottom: 2 },
  tabLabel: { color: C.gray, fontSize: 11 },
  tabActive: { color: C.gold, fontWeight: 'bold' },
});
