// Polyfills for web environment compatibility with older react-native-web
if (typeof window !== 'undefined') {
  (window as any).hydrate = (window as any).hydrate || (() => {});
}

import React, { useState, useEffect } from 'react';

const API_URL = 'https://pegslam.com';
const { width } = Dimensions.get('window');

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'competitions', label: 'Competitions', icon: '🎣' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'more', label: 'More', icon: '⋮' },
];

function Header({ onOpenMenu, isLoggedIn, toggleRadio, isRadioPlaying }: any) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => onOpenMenu('more')} style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.logoText}>PEG SLAM</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={toggleRadio} style={styles.iconButton}>
          <Text style={styles.icon}>{isRadioPlaying ? '⏹' : '📻'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => isLoggedIn ? onOpenMenu('profile') : onOpenMenu('login')} style={styles.iconButton}>
          <Text style={styles.icon}>{isLoggedIn ? '👤' : '🔑'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CompetitionCard({ item, onPress }: any) {
  const imageUrl = item.imageUrl?.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`;
  return (
    <TouchableOpacity style={styles.compCard} onPress={() => onPress(item)}>
      <Image source={{ uri: imageUrl || 'https://via.placeholder.com/300' }} style={styles.compImage} />
      <View style={styles.compInfo}>
        <Text style={styles.compTitle}>{item.name}</Text>
        <Text style={styles.compVenue}>{item.venue}</Text>
        <Text style={styles.compDate}>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <View style={styles.compFooter}>
          <Text style={styles.compFee}>Entry: £{item.entryFee}</Text>
          <Text style={styles.compPegs}>{item.pegsTotal - item.pegsBooked} pegs left</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function NewsCard({ item, onPress }: any) {
  const imageUrl = item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`;
  return (
    <TouchableOpacity style={styles.newsCard} onPress={() => onPress(item)}>
      <Image source={{ uri: imageUrl || 'https://via.placeholder.com/300' }} style={styles.newsImage} />
      <View style={styles.newsInfo}>
        <View style={styles.newsHeader}>
          <Text style={styles.newsCategory}>{item.category?.toUpperCase()}</Text>
          <Text style={styles.newsDate}>{item.date}</Text>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsExcerpt} numberOfLines={3}>{item.excerpt}</Text>
      </View>
    </TouchableOpacity>
  );
}

function LeaderboardItem({ entry, index }: any) {
  return (
    <View style={styles.leaderboardRow}>
      <Text style={styles.leaderboardPos}>{entry.position || index + 1}</Text>
      <View style={styles.leaderboardMain}>
        <Text style={styles.leaderboardAngler}>{entry.anglerName}</Text>
        <Text style={styles.leaderboardClub}>{entry.club || 'Independent'}</Text>
      </View>
      <View style={styles.leaderboardRight}>
        <Text style={styles.leaderboardWeight}>{entry.weight}</Text>
        <Text style={styles.leaderboardPeg}>Peg {entry.pegNumber}</Text>
      </View>
    </View>
  );
}

function CompetitionDetailsModal({ competition, visible, onClose }: any) {
  if (!competition) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>{competition.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <Image source={{ uri: competition.imageUrl?.startsWith('http') ? competition.imageUrl : `${API_URL}${competition.imageUrl}` }} style={styles.detailImage} />
          <View style={styles.detailContent}>
            <Text style={styles.detailVenue}>📍 {competition.venue}</Text>
            <Text style={styles.detailDate}>📅 {new Date(competition.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.detailFee}>💷 Entry Fee: £{competition.entryFee}</Text>
            <Text style={styles.detailPrize}>🏆 Prize Pool: £{competition.prizePool}</Text>
            <View style={styles.divider} />
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailText}>{stripHtml(competition.description)}</Text>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ArticleModal({ article, visible, onClose }: any) {
  if (!article) return null;
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>{article.title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <Image source={{ uri: article.image?.startsWith('http') ? article.image : `${API_URL}${article.image}` }} style={styles.detailImage} />
          <View style={styles.detailContent}>
            <View style={styles.newsHeader}>
              <Text style={styles.newsCategory}>{article.category?.toUpperCase()}</Text>
              <Text style={styles.newsDate}>{article.date} • {article.readTime}</Text>
            </View>
            <Text style={styles.articleTitle}>{article.title}</Text>
            <View style={styles.divider} />
            <Text style={styles.detailText}>{article.content ? stripHtml(article.content) : article.excerpt}</Text>
            <Text style={styles.articleAuthor}>By {article.author}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SideDrawer({ visible, onClose, onMenuSelect, isLoggedIn, onLogout }: any) {
  const MENU_ITEMS = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'competitions', label: 'Competitions', icon: '🎣' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'sponsors', label: 'Sponsors', icon: '🤝' },
    { id: 'gallery', label: 'Gallery', icon: '🖼️' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
    { id: 'contact', label: 'Contact', icon: '📧' },
  ];
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        <View style={styles.drawerContent}>
          <SafeAreaView style={styles.drawerInner}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity key={item.id} style={styles.drawerItem} onPress={() => { onMenuSelect(item.id); onClose(); }}>
                  <Text style={styles.drawerIcon}>{item.icon}</Text>
                  <Text style={styles.drawerLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
              {isLoggedIn && (
                <TouchableOpacity style={styles.drawerItem} onPress={onLogout}>
                  <Text style={styles.drawerIcon}>🚪</Text>
                  <Text style={styles.drawerLabel}>Logout</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function LoginModal({ visible, onClose, onLoginSuccess }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/api/user/login', { email, password });
      await AsyncStorage.setItem('token', res.data.token);
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Login</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor="#666" />
          <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#666" />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState<any>(null);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await apiClient.get('/api/auth/me');
        setUser(res.data);
      }
    } catch (err) {
      console.log('Auth check error');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [compRes, newsRes] = await Promise.all([
        apiClient.get('/api/competitions'),
        apiClient.get('/api/news?limit=5')
      ]);
      setCompetitions(compRes.data || []);
      setNews(newsRes.data?.news || []);
      
      const liveComp = compRes.data?.find((c: any) => c.status === 'live');
      if (liveComp) {
        const lbRes = await apiClient.get(`/api/competitions/${liveComp.id}/leaderboard`);
        setLeaderboard(lbRes.data || []);
      }
    } catch (err) {
      console.log('Fetch data error');
    }
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B7342" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Header 
        onOpenMenu={(menu: string) => menu === 'login' ? setShowLoginModal(true) : setShowMoreModal(true)}
        isLoggedIn={!!user}
        isRadioPlaying={isRadioPlaying}
        toggleRadio={() => setIsRadioPlaying(!isRadioPlaying)}
      />
      <View style={styles.content}>
        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Featured Matches</Text>
            {competitions.slice(0, 2).map(comp => (
              <CompetitionCard key={comp.id} item={comp} onPress={setSelectedComp} />
            ))}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.title}>Latest News</Text>
              <TouchableOpacity onPress={() => setActiveTab('news')}>
                <Text style={styles.viewMoreText}>See All</Text>
              </TouchableOpacity>
            </View>
            {news.slice(0, 2).map(item => (
              <NewsCard key={item.id} item={item} onPress={setSelectedArticle} />
            ))}
          </ScrollView>
        )}
        {activeTab === 'competitions' && (
          <FlatList
            data={competitions}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <CompetitionCard item={item} onPress={setSelectedComp} />}
            contentContainerStyle={styles.scrollContent}
            ListHeaderComponent={<Text style={styles.title}>All Matches</Text>}
          />
        )}
        {activeTab === 'news' && (
          <FlatList
            data={news}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <NewsCard item={item} onPress={setSelectedArticle} />}
            contentContainerStyle={styles.scrollContent}
            ListHeaderComponent={<Text style={styles.title}>Latest News</Text>}
          />
        )}
        {activeTab === 'leaderboard' && (
          <View style={styles.content}>
            <Text style={[styles.title, { padding: 15 }]}>Live Standings</Text>
            {leaderboard.length > 0 ? (
              <FlatList
                data={leaderboard}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => <LeaderboardItem entry={item} index={index} />}
                contentContainerStyle={styles.scrollContent}
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>No live competitions today.</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.id} style={styles.tabItem} onPress={() => tab.id === 'more' ? setShowMoreModal(true) : setActiveTab(tab.id)}>
            <Text style={[styles.tabIcon, activeTab === tab.id && styles.activeTab]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.activeTab]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <LoginModal visible={showLoginModal} onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLogin} />
      <SideDrawer visible={showMoreModal} onClose={() => setShowMoreModal(false)} onMenuSelect={setActiveTab} isLoggedIn={!!user} onLogout={handleLogout} />
      <CompetitionDetailsModal competition={selectedComp} visible={!!selectedComp} onClose={() => setSelectedComp(null)} />
      <ArticleModal article={selectedArticle} visible={!!selectedArticle} onClose={() => setSelectedArticle(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuButton: { marginRight: 15 },
  menuButtonIcon: { color: '#fff', fontSize: 24 },
  logoText: { color: '#1B7342', fontSize: 20, fontWeight: 'bold' },
  headerRight: { flexDirection: 'row' },
  iconButton: { marginLeft: 15 },
  icon: { color: '#fff', fontSize: 20 },
  content: { flex: 1 },
  scrollContent: { padding: 15 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  compCard: { backgroundColor: '#111', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  compImage: { width: '100%', height: 180 },
  compInfo: { padding: 12 },
  compTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  compVenue: { color: '#999', fontSize: 14, marginBottom: 3 },
  compDate: { color: '#1B7342', fontSize: 14, fontWeight: '500', marginBottom: 10 },
  compFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compFee: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  compPegs: { color: '#ffcc00', fontSize: 12 },
  newsCard: { backgroundColor: '#111', borderRadius: 12, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  newsImage: { width: '100%', height: 150 },
  newsInfo: { padding: 12 },
  newsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  newsCategory: { color: '#1B7342', fontSize: 12, fontWeight: 'bold' },
  newsDate: { color: '#666', fontSize: 12 },
  newsTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  newsExcerpt: { color: '#999', fontSize: 13, lineHeight: 18 },
  leaderboardRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#111', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  leaderboardPos: { color: '#1B7342', fontSize: 20, fontWeight: 'bold', width: 40 },
  leaderboardMain: { flex: 1 },
  leaderboardAngler: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  leaderboardClub: { color: '#666', fontSize: 12 },
  leaderboardRight: { alignItems: 'flex-end' },
  leaderboardWeight: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  leaderboardPeg: { color: '#999', fontSize: 12 },
  viewMoreText: { color: '#1B7342', fontWeight: 'bold' },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  placeholderText: { color: '#666', fontSize: 16 },
  tabBar: { height: 60, flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#111' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabIcon: { fontSize: 20, color: '#666' },
  tabLabel: { fontSize: 10, color: '#666', marginTop: 2 },
  activeTab: { color: '#1B7342' },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
  overlayTouchable: { flex: 1 },
  drawerContent: { width: 280, backgroundColor: '#111', height: '100%' },
  drawerInner: { flex: 1 },
  drawerHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  drawerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeIcon: { color: '#fff', fontSize: 20 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  drawerIcon: { fontSize: 20, marginRight: 15 },
  drawerLabel: { color: '#fff', fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: '#000' },
  modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#333' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 10 },
  modalBody: { flex: 1 },
  detailImage: { width: '100%', height: 250 },
  detailContent: { padding: 20 },
  detailVenue: { color: '#fff', fontSize: 16, marginBottom: 10 },
  detailDate: { color: '#1B7342', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  detailFee: { color: '#fff', fontSize: 16, marginBottom: 5 },
  detailPrize: { color: '#ffcc00', fontSize: 16, marginBottom: 15 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  detailLabel: { color: '#999', fontSize: 14, marginBottom: 8, textTransform: 'uppercase' },
  detailText: { color: '#ccc', fontSize: 15, lineHeight: 22 },
  articleTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  articleAuthor: { color: '#666', fontSize: 14, marginTop: 20 },
  bookButton: { backgroundColor: '#1B7342', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 30 },
  bookButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  input: { backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#1B7342', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
