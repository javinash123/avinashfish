import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  SafeAreaView,
  Modal,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://pegslam.com';
const { width } = Dimensions.get('window');

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Utility to strip HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// Menu Items matching website navigation
const MENU_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'competitions', label: 'Competitions', icon: '🎣' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'anglers', label: 'Angler Directory', icon: '👥' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'gallery', label: 'Gallery', icon: '📸' },
  { id: 'sponsors', label: 'Sponsors', icon: '💼' },
  { id: 'about', label: 'About', icon: 'ℹ️' },
  { id: 'contact', label: 'Contact', icon: '✉️' },
];

// Login Modal
function LoginModal({ visible, onClose, onLoginSuccess }: any) {
  // onLoginSuccess callback receives user data when login succeeds
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [club, setClub] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/user/login', { email, password });
      if (response.data) {
        await AsyncStorage.setItem('userToken', JSON.stringify(response.data));
        Alert.alert('Success', `Welcome back, ${response.data.firstName}!`);
        onLoginSuccess(response.data);
        onClose();
        setEmail('');
        setPassword('');
        setErrorMessage('');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password';
      setErrorMessage(message);
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    if (!firstName || !lastName || !email || !username || !password) {
      setErrorMessage('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/user/register', {
        firstName,
        lastName,
        email,
        username,
        password,
        club: club || undefined,
      });
      if (response.data) {
        await AsyncStorage.setItem('userToken', JSON.stringify(response.data));
        Alert.alert('Success', 'Account created! Welcome to Peg Slam!');
        onLoginSuccess(response.data);
        onClose();
        setFirstName('');
        setLastName('');
        setEmail('');
        setUsername('');
        setPassword('');
        setClub('');
        setErrorMessage('');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      setErrorMessage(message);
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage('');
    if (!resetEmail) {
      setErrorMessage('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/forgot-password', { 
        email: resetEmail 
      });
      if (response.data) {
        setResetMessage('Password reset instructions have been sent to ' + resetEmail);
        setResetEmail('');
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage('');
        }, 3000);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      setErrorMessage(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      console.log('Fetching logo from API...');
      apiClient.get('/api/site-settings')
        .then(res => {
          console.log('Logo API response:', res.data);
          let url = res.data?.logoUrl;
          console.log('Logo URL from API:', url);
          // Convert relative URLs to absolute
          if (url && !url.startsWith('http')) {
            url = API_URL + url;
          }
          console.log('Final logo URL:', url);
          setLogoUrl(url || '');
        })
        .catch(err => {
          console.log('Logo fetch error:', err.message);
          console.log('Error details:', err);
        });
    }
  }, [visible]);

  if (!visible) return null;

  // Forgot Password Screen
  if (showForgotPassword) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButtonContainer} 
              onPress={() => {
                setShowForgotPassword(false);
                setErrorMessage('');
                setResetMessage('');
                setResetEmail('');
              }}
            >
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoSection}>
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={[styles.authLogoImage, { width: 280, height: 150 }]}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Text style={styles.logoTitle}>PEG SLAM</Text>
                  <Text style={styles.logoSubtitle}>UK Fishing Competitions</Text>
                </>
              )}
            </View>

            {/* Header */}
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>Reset Your Password</Text>
              <Text style={styles.authSubtitle}>Enter your email address and we'll send you a password reset link</Text>
            </View>

            {/* Success Message */}
            {resetMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{resetMessage}</Text>
              </View>
            ) : null}

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.authInput}
                placeholder="angler@example.com"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                placeholderTextColor="#999"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.authButtonText}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={styles.modalContainer}>
        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Logo */}
          <View style={styles.logoSection}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={[styles.authLogoImage, { width: 280, height: 150 }]}
                resizeMode="contain"
              />
            ) : (
              <>
                <Text style={styles.logoTitle}>PEG SLAM</Text>
                <Text style={styles.logoSubtitle}>UK Fishing Competitions</Text>
              </>
            )}
          </View>

          {/* Header */}
          <View style={styles.authHeader}>
            <Text style={styles.authTitle}>
              {showRegister ? 'Create Your Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.authSubtitle}>
              {showRegister ? 'Join our fishing community' : 'Sign in to your Peg Slam account'}
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButtonContainer} onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Registration Fields */}
          {showRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Angler"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="john_angler"
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Fishing Club (Optional)</Text>
                <TextInput
                  style={styles.authInput}
                  placeholder="Your club name"
                  value={club}
                  onChangeText={setClub}
                  placeholderTextColor="#999"
                  editable={!loading}
                />
              </View>
            </>
          )}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.authInput}
              placeholder="angler@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            {!showRegister && (
              <View style={styles.passwordHeader}>
                <Text style={styles.inputLabel}>Password</Text>
                <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
                  <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            )}
            {showRegister && <Text style={styles.inputLabel}>Password</Text>}
            <TextInput
              style={styles.authInput}
              placeholder={showRegister ? 'At least 6 characters' : 'Enter your password'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#999"
              editable={!loading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.authButton, loading && styles.authButtonDisabled]}
            onPress={showRegister ? handleRegister : handleLogin}
            disabled={loading}
          >
            <Text style={styles.authButtonText}>
              {loading ? 'Please wait...' : showRegister ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Toggle Button */}
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>
              {showRegister ? 'Already have an account? ' : "Don't have an account? "}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowRegister(!showRegister);
              setErrorMessage('');
            }}>
              <Text style={styles.toggleLink}>
                {showRegister ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Drawer Navigation
function SideDrawer({ visible, onClose, onMenuSelect, isLoggedIn, onLogout }: any) {
  return (
    <Modal visible={visible} animationType="none" transparent={true}>
      <View style={styles.drawerOverlay}>
        {/* Overlay to close drawer */}
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Drawer Content */}
        <View style={styles.drawerContent}>
          <SafeAreaView style={styles.drawerInner}>
            <View style={styles.drawerHeader}>
              <Image
                source={require('./assets/logo.png')}
                style={styles.drawerLogoImage}
              />
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.drawerClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerMenu}>
              {isLoggedIn && (
                <TouchableOpacity
                  style={styles.drawerMenuItem}
                  onPress={() => {
                    onMenuSelect('profile');
                    onClose();
                  }}
                >
                  <Text style={styles.drawerMenuIcon}>👤</Text>
                  <Text style={styles.drawerMenuLabel}>My Profile</Text>
                </TouchableOpacity>
              )}
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.drawerMenuItem}
                  onPress={() => {
                    onMenuSelect(item.id);
                    onClose();
                  }}
                >
                  <Text style={styles.drawerMenuIcon}>{item.icon}</Text>
                  <Text style={styles.drawerMenuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.drawerFooter}>
              {isLoggedIn ? (
                <TouchableOpacity
                  style={styles.drawerLogoutButton}
                  onPress={() => {
                    onLogout();
                    onClose();
                  }}
                >
                  <Text style={styles.drawerLogoutButtonText}>Logout</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.drawerLoginButton}
                  onPress={() => {
                    onMenuSelect('login');
                    onClose();
                  }}
                >
                  <Text style={styles.drawerLoginButtonText}>Login / Register</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

// Competition Card
function CompetitionCard({ item, onViewDetails }: any) {
  const getImageUrl = () => {
    const url = item.thumbnailUrl || item.thumbnailUrlMd || item.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const imageUrl = getImageUrl();
  const pegsAvailable = item.pegsTotal - item.pegsBooked;

  return (
    <View style={styles.competitionCard}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.competitionImage}
          resizeMode="cover"
          onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
        />
      ) : (
        <View style={[styles.competitionImage, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>No Image Available</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.competitionTitle} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{item.date || 'TBA'}</Text>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.detailLabel}>Venue</Text>
          <Text style={styles.detailValue}>{item.venue || 'N/A'}</Text>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.detailLabel}>Pegs Available</Text>
          <Text style={styles.detailValue}>{pegsAvailable}/{item.pegsTotal}</Text>
        </View>
        <View style={styles.cardDetails}>
          <Text style={styles.detailLabel}>Entry Fee</Text>
          <Text style={styles.priceValue}>£{item.entryFee || '0'}</Text>
        </View>
        <TouchableOpacity style={styles.cardButton} onPress={() => onViewDetails(item)}>
          <Text style={styles.cardButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Hero Carousel Component
function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderImages, setSliderImages] = useState<any[]>([]);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchSliderImages();
  }, []);

  const fetchSliderImages = async () => {
    try {
      setCarouselLoading(true);
      const response = await apiClient.get('/api/slider-images');
      setSliderImages(response.data || []);
      console.log('Slider images loaded:', response.data?.length || 0, 'images');
    } catch (error) {
      console.error('Error fetching slider images:', error);
      setSliderImages([]);
    } finally {
      setCarouselLoading(false);
    }
  };

  useEffect(() => {
    if (sliderImages.length <= 1) return;
    
    // Auto-rotate carousel every 5 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [sliderImages.length]);

  useEffect(() => {
    // Scroll to current index
    if (scrollViewRef.current && width > 0) {
      scrollViewRef.current.scrollTo({ x: currentIndex * width, animated: true });
    }
  }, [currentIndex]);

  if (carouselLoading || sliderImages.length === 0) {
    return (
      <View style={styles.heroSection}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>UK's Premier Fishing Competitions</Text>
          <Text style={styles.heroSubtitle}>Book your peg. Compete for glory.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        scrollEnabled={false}
      >
        {sliderImages.map((image: any, idx: number) => {
          const url = image.imageUrl;
          const imageUrl = url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : null;

          return (
            <View key={idx} style={[styles.carouselSlide, { width }]}>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                  onError={(e) => console.log(`Carousel ${idx} image error:`, e.nativeEvent.error)}
                />
              ) : (
                <View style={styles.carouselImagePlaceholder} />
              )}
              <View style={styles.heroOverlay} />
            </View>
          );
        })}
      </ScrollView>
      {/* Carousel Indicators */}
      <View style={styles.carouselIndicators}>
        {sliderImages.map((_, idx: number) => (
          <TouchableOpacity
            key={idx}
            onPress={() => setCurrentIndex(idx)}
            style={[
              styles.indicatorDot,
              idx === currentIndex && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// Leaderboard Page Component
function LeaderboardPage({ competitions }: any) {
  const [selectedCompId, setSelectedCompId] = useState(competitions[0]?.id || '');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);

  useEffect(() => {
    if (selectedCompId) {
      fetchLeaderboard(selectedCompId);
    }
  }, [selectedCompId]);

  const fetchLeaderboard = async (compId: string) => {
    setLeaderLoading(true);
    try {
      const response = await apiClient.get(`/api/competitions/${compId}/leaderboard`);
      setLeaderboardData(response.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboardData([]);
    } finally {
      setLeaderLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      
      {/* Competition Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compSelector}>
        {competitions.map((comp: any) => (
          <TouchableOpacity
            key={comp.id}
            style={[
              styles.compSelectorButton,
              selectedCompId === comp.id && styles.compSelectorButtonActive,
            ]}
            onPress={() => setSelectedCompId(comp.id)}
          >
            <Text
              style={[
                styles.compSelectorText,
                selectedCompId === comp.id && styles.compSelectorTextActive,
              ]}
              numberOfLines={1}
            >
              {comp.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leaderboard Table */}
      {leaderLoading ? (
        <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
      ) : leaderboardData.length > 0 ? (
        <View style={styles.leaderboardTable}>
          {/* Table Header */}
          <View style={styles.leaderboardHeaderRow}>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Pos</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, styles.leaderboardCellWide]}>Angler</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Peg</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Weight</Text>
          </View>
          {/* Table Rows */}
          {leaderboardData.slice(0, 20).map((entry: any, idx: number) => (
            <View key={idx} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardCell}>{entry.position || idx + 1}</Text>
              <Text style={[styles.leaderboardCell, styles.leaderboardCellWide]} numberOfLines={1}>
                {entry.anglerName || entry.username || 'Unknown'}
              </Text>
              <Text style={styles.leaderboardCell}>{entry.pegNumber}</Text>
              <Text style={styles.leaderboardCell}>{entry.weight || '0lb'}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>No leaderboard data available</Text>
        </View>
      )}
    </View>
  );
}

// Competition Details Page
function CompetitionDetailsPage({ competition, onClose }: any) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joiningLeaving, setJoiningLeaving] = useState(false);

  const getImageUrl = () => {
    const url = competition.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const getCompetitionStatus = () => {
    if (!competition.date) return 'upcoming';
    const compDate = new Date(competition.date);
    const now = new Date();
    if (compDate < now) return 'completed';
    return 'upcoming';
  };

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'participants') {
      fetchParticipants();
    }
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const response = await apiClient.get(`/api/competitions/${competition.id}/leaderboard`);
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const fetchParticipants = async () => {
    setLoadingParticipants(true);
    try {
      const response = await apiClient.get(`/api/competitions/${competition.id}/participants`);
      setParticipants(response.data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const imageUrl = getImageUrl();
  const status = getCompetitionStatus();
  const pegsRemaining = competition.pegsTotal - competition.pegsBooked;

  const handleJoinCompetition = async () => {
    setJoiningLeaving(true);
    try {
      const response = await apiClient.post(`/api/competitions/${competition.id}/join`, {});
      if (response.data.success) {
        setIsJoined(true);
        Alert.alert('Success', 'You have joined the competition!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join competition');
    } finally {
      setJoiningLeaving(false);
    }
  };

  const handleLeaveCompetition = async () => {
    setJoiningLeaving(true);
    try {
      const response = await apiClient.delete(`/api/competitions/${competition.id}/leave`);
      if (response.data.success) {
        setIsJoined(false);
        Alert.alert('Success', 'You have left the competition');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to leave competition');
    } finally {
      setJoiningLeaving(false);
    }
  };

  const shareCompetition = (platform: string) => {
    const compUrl = `https://pegslam.com/competitions/${competition.id}`;
    const text = `Check out: ${competition.name} - Join us for an exciting fishing competition at ${competition.venue}!`;
    
    try {
      if (platform === 'whatsapp') {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + compUrl)}`;
        Alert.alert('Share', 'Open WhatsApp and share this link');
      } else if (platform === 'copy') {
        Alert.alert('Success', 'Competition link: ' + compUrl);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share competition');
    }
  };

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={onClose} style={styles.detailsBackButton}>
          <Text style={styles.detailsBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailsTitle, { flex: 1, marginLeft: 10, marginRight: 10 }]} numberOfLines={1}>{competition.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.detailsImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.detailsImage, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>No Image Available</Text>
            </View>
          )}
          <View style={[styles.statusBadge, status === 'completed' ? { backgroundColor: '#888' } : { backgroundColor: '#1B7342' }]}>
            <Text style={styles.statusBadgeText}>{status === 'completed' ? 'Completed' : 'Upcoming'}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>{competition.name}</Text>
          
          <View style={styles.competitionModeRow}>
            <Text style={styles.competitionModeLabel}>
              {competition.competitionMode === 'team' ? '👥 Team Competition' : '👤 Individual Competition'}
            </Text>
          </View>

          <Text style={styles.competitionDescription}>
            {competition.description || 'No description available'}
          </Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Key Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>📅 Date</Text>
            <Text style={styles.detailRowValue}>{competition.date || 'TBA'}{competition.endDate && competition.endDate !== competition.date ? ` - ${competition.endDate}` : ''}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>🕐 Time</Text>
            <Text style={styles.detailRowValue}>{competition.time || 'TBA'}{competition.endTime ? ` - ${competition.endTime}` : ''}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>📍 Venue</Text>
            <Text style={styles.detailRowValue}>{competition.venue || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>💷 Entry Fee</Text>
            <Text style={styles.detailRowValue}>£{competition.entryFee || '0'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>🏆 Prize Pool</Text>
            <Text style={styles.detailRowValue}>£{competition.prizePool || '0'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>🎣 Pegs</Text>
            <Text style={styles.detailRowValue}>{competition.pegsBooked}/{competition.pegsTotal} booked</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>👥 Type</Text>
            <Text style={styles.detailRowValue}>{competition.competitionMode === 'team' ? 'Team Competition' : 'Individual Competition'}</Text>
          </View>

          <View style={styles.pegsRemainingBar}>
            <View style={[styles.pegsRemainingFill, { width: `${(competition.pegsBooked / competition.pegsTotal) * 100}%` }]} />
          </View>
          <Text style={styles.pegsRemainingText}>{pegsRemaining} pegs remaining</Text>
        </View>

        {/* Action Buttons */}
        {status !== 'completed' && (
          <View>
            {isJoined ? (
              <TouchableOpacity 
                style={[styles.bookButton, { backgroundColor: '#888' }]}
                onPress={handleLeaveCompetition}
                disabled={joiningLeaving}
              >
                <Text style={styles.bookButtonText}>{joiningLeaving ? 'Leaving...' : 'Leave Competition'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.bookButton, { backgroundColor: '#1B7342', opacity: pegsRemaining > 0 ? 1 : 0.5 }]}
                onPress={handleJoinCompetition}
                disabled={joiningLeaving || pegsRemaining <= 0}
              >
                <Text style={styles.bookButtonText}>{joiningLeaving ? 'Joining...' : pegsRemaining > 0 ? 'Join Competition' : 'Fully Booked'}</Text>
              </TouchableOpacity>
            )}

            {/* Share Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity 
                style={[styles.bookButton, { flex: 1, backgroundColor: '#25D366' }]}
                onPress={() => shareCompetition('whatsapp')}
              >
                <Text style={styles.bookButtonText}>Share WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.bookButton, { flex: 1, backgroundColor: '#555' }]}
                onPress={() => shareCompetition('copy')}
              >
                <Text style={styles.bookButtonText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'participants' && styles.tabActive]}
            onPress={() => setActiveTab('participants')}
          >
            <Text style={[styles.tabText, activeTab === 'participants' && styles.tabTextActive]}>Participants</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>Leaderboard</Text>
          </TouchableOpacity>
        </View>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            {competition.description && (
              <View style={[styles.detailsSection, { marginBottom: 16 }]}>
                <Text style={styles.detailsSectionTitle}>Description</Text>
                <Text style={styles.competitionDescription}>{competition.description}</Text>
              </View>
            )}
            
            {competition.rules && (
              <View style={[styles.detailsSection, { marginBottom: 16 }]}>
                <Text style={styles.detailsSectionTitle}>Rules & Regulations</Text>
                <Text style={{ color: '#999', fontSize: 14, lineHeight: 20 }}>{competition.rules}</Text>
              </View>
            )}

            {!competition.rules && !competition.description && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No additional details available</Text>
              </View>
            )}
          </View>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <View style={styles.tabContent}>
            {loadingParticipants ? (
              <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 40 }} />
            ) : participants.length > 0 ? (
              <View style={styles.participantsList}>
                {participants.map((participant: any, idx: number) => (
                  <View key={idx} style={styles.participantCard}>
                    <View style={styles.participantAvatarContainer}>
                      {participant.avatar ? (
                        <Image source={{ uri: participant.avatar }} style={styles.participantAvatar} />
                      ) : (
                        <View style={styles.participantAvatarPlaceholder}>
                          <Text style={styles.participantAvatarText}>
                            {participant.name?.charAt(0) || 'U'}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName} numberOfLines={1}>{participant.name || 'Unknown'}</Text>
                      {participant.club && <Text style={styles.participantClub} numberOfLines={1}>{participant.club}</Text>}
                    </View>
                    {participant.pegNumber && (
                      <View style={styles.pegBadge}>
                        <Text style={styles.pegBadgeText}>Peg {participant.pegNumber}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No participants yet. Be the first to join!</Text>
              </View>
            )}
          </View>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <View style={styles.tabContent}>
            {loadingLeaderboard ? (
              <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 40 }} />
            ) : leaderboard.length > 0 ? (
              <View style={styles.leaderboardTable}>
                <View style={styles.leaderboardHeaderRow}>
                  <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Pos</Text>
                  <Text style={[styles.leaderboardCell, styles.leaderboardHeader, styles.leaderboardCellWide]}>Angler</Text>
                  <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Peg</Text>
                  <Text style={[styles.leaderboardCell, styles.leaderboardHeader]}>Weight</Text>
                </View>
                {leaderboard.slice(0, 25).map((entry: any, idx: number) => (
                  <View key={idx} style={styles.leaderboardRow}>
                    <Text style={styles.leaderboardCell}>{entry.position || idx + 1}</Text>
                    <Text style={[styles.leaderboardCell, styles.leaderboardCellWide]} numberOfLines={1}>
                      {entry.anglerName || entry.name || 'Unknown'}
                    </Text>
                    <Text style={styles.leaderboardCell}>{entry.pegNumber || '-'}</Text>
                    <Text style={styles.leaderboardCell}>{entry.weight || '0lb'}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No leaderboard data available</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// News Detail Page
function NewsDetailPage({ article, onClose }: any) {
  const shareNews = (platform: string) => {
    const newsUrl = `https://pegslam.com/news?article=${article.id}`;
    const text = `Check out: ${article.title}`;
    
    try {
      if (platform === 'whatsapp') {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' - ' + newsUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(waUrl, '_blank');
        } else {
          window.open(waUrl, '_blank');
        }
      } else if (platform === 'facebook') {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(newsUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(fbUrl, '_blank');
        } else {
          window.open(fbUrl, '_blank');
        }
      } else if (platform === 'x') {
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(newsUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(xUrl, '_blank');
        } else {
          window.open(xUrl, '_blank');
        }
      } else if (platform === 'copy') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(newsUrl).then(() => {
            Alert.alert('Success', 'News link copied to clipboard!');
          }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = newsUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Alert.alert('Success', 'News link copied to clipboard!');
          });
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = newsUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          Alert.alert('Success', 'News link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share news.');
    }
  };

  const imageUrl = article.imageUrl || article.featuredImage || article.image;
  const fullImageUrl = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`) : null;

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={onClose} style={styles.detailsBackButton}>
          <Text style={styles.detailsBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.detailsTitle, { maxWidth: '70%' }]} numberOfLines={1}>{article.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        {fullImageUrl ? (
          <Image
            source={{ uri: fullImageUrl }}
            style={styles.detailsImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.detailsImage, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#666', fontSize: 16, textAlign: 'center' }}>No Image Available</Text>
          </View>
        )}

        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>{article.title}</Text>
          <Text style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
            {article.category || 'News'} • {article.date || 'Today'}
          </Text>
          <Text style={styles.detailsDescription}>
            {stripHtml(article.content || article.description || article.excerpt || '')}
          </Text>
        </View>

        <View style={styles.shareButtonsContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={() => shareNews('whatsapp')}>
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={() => shareNews('facebook')}>
            <Text style={styles.shareButtonText}>Facebook</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={() => shareNews('x')}>
            <Text style={styles.shareButtonText}>X/Twitter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={() => shareNews('copy')}>
            <Text style={styles.shareButtonText}>Copy Link</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// News Card
function NewsCard({ item, onPress }: any) {
  const getImageUrl = () => {
    // Try to extract image URL from content HTML or use imageUrl field
    const url = item.imageUrl || item.featuredImage || item.image;
    if (!url) {
      console.log('News item missing image:', { title: item.title, fields: Object.keys(item).slice(0, 10) });
      return null;
    }
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const imageUrl = getImageUrl();
  const cleanDescription = stripHtml(item.description || item.excerpt || item.content || '');

  return (
    <TouchableOpacity style={styles.newsCard} onPress={() => onPress(item)}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.newsImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.newsImage, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#666', fontSize: 12, textAlign: 'center' }}>No Image</Text>
        </View>
      )}
      <View style={styles.newsContent}>
        <View style={styles.newsHeader}>
          <Text style={styles.newsCategory}>{item.category || 'News'}</Text>
          <Text style={styles.newsDate}>{item.date || 'Today'}</Text>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.newsDescription} numberOfLines={3}>
          {cleanDescription}
        </Text>
        <Text style={styles.readMore}>Read More →</Text>
      </View>
    </TouchableOpacity>
  );
}

// Angler Card Component
function AnglerCard({ angler, onPress }: any) {
  const initials = `${angler.firstName?.[0] || 'A'}${angler.lastName?.[0] || 'U'}`;
  return (
    <TouchableOpacity style={styles.anglerCard} onPress={onPress}>
      <View style={styles.anglerAvatar}>
        {angler.avatar ? (
          <Image source={{ uri: angler.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
      <Text style={styles.anglerName} numberOfLines={1}>{angler.firstName} {angler.lastName}</Text>
      <Text style={styles.anglerUsername} numberOfLines={1}>@{angler.username}</Text>
      {angler.club && <Text style={styles.anglerClub} numberOfLines={1}>{angler.club}</Text>}
      {angler.location && <Text style={styles.anglerLocation} numberOfLines={1}>{angler.location}</Text>}
      {angler.favouriteSpecies && <Text style={styles.anglerSpecies} numberOfLines={1}>Species: {angler.favouriteSpecies}</Text>}
    </TouchableOpacity>
  );
}

// Angler Directory Page
function AnglerDirectoryPage({ anglers, loading, onSelectAngler, onSearch, onSort, search, sortBy, page, onPageChange }: any) {
  const filteredAnglers = anglers.slice((page - 1) * 12, page * 12);
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Angler Directory</Text>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, username, club..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={onSearch}
        />
      </View>

      {/* Sort Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
        {[
          { label: 'Name A-Z', value: 'name-asc' },
          { label: 'Name Z-A', value: 'name-desc' },
          { label: 'Newest', value: 'memberSince-desc' },
          { label: 'Oldest', value: 'memberSince-asc' },
          { label: 'Club A-Z', value: 'club-asc' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.sortButton, sortBy === opt.value && styles.sortButtonActive]}
            onPress={() => onSort(opt.value)}
          >
            <Text style={[styles.sortButtonText, sortBy === opt.value && styles.sortButtonTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
      ) : filteredAnglers.length > 0 ? (
        <>
          <View style={styles.anglersGrid}>
            {filteredAnglers.map((angler: any, idx: number) => (
              <AnglerCard key={idx} angler={angler} onPress={() => onSelectAngler(angler)} />
            ))}
          </View>
          {Math.ceil(anglers.length / 12) > 1 && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <Text style={styles.paginationButtonText}>← Prev</Text>
              </TouchableOpacity>
              <Text style={styles.paginationText}>Page {page} of {Math.ceil(anglers.length / 12)}</Text>
              <TouchableOpacity
                style={[styles.paginationButton, page >= Math.ceil(anglers.length / 12) && styles.paginationButtonDisabled]}
                onPress={() => onPageChange(Math.min(Math.ceil(anglers.length / 12), page + 1))}
                disabled={page >= Math.ceil(anglers.length / 12)}
              >
                <Text style={styles.paginationButtonText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>No anglers found</Text>
      )}
    </View>
  );
}

// Angler Profile Page
function AnglerProfilePage({ angler, onClose }: any) {
  const initials = `${angler.firstName?.[0] || 'A'}${angler.lastName?.[0] || 'U'}`;
  const [stats, setStats] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: angler.firstName, lastName: angler.lastName, club: angler.club, bio: angler.bio, location: angler.location, favouriteMethod: angler.favouriteMethod, favouriteSpecies: angler.favouriteSpecies, avatar: angler.avatar });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '', showCurrent: false, showNew: false, showConfirm: false });
  const [galleryForm, setGalleryForm] = useState({ photoUri: '', caption: '' });
  const [avatarForm, setAvatarForm] = useState({ photoUri: '', uploading: false });
  const [galleryCaption, setGalleryCaption] = useState('');
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchGallery();
    fetchParticipations();
  }, [angler.username]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get(`/api/users/${angler.username}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchGallery = async () => {
    try {
      setGalleryLoading(true);
      const response = await apiClient.get(`/api/users/${angler.username}/gallery`);
      setGallery(response.data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchParticipations = async () => {
    try {
      setParticipationsLoading(true);
      const response = await apiClient.get(`/api/users/${angler.username}/participations`);
      setParticipations(response.data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setParticipationsLoading(false);
    }
  };

  const getCompetitionStatus = (comp: any) => {
    const now = new Date();
    const start = new Date(comp.date);
    const end = new Date(comp.endDate || comp.date);
    
    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'live';
    return 'upcoming';
  };

  const shareProfile = (platform: string) => {
    const profileUrl = `https://pegslam.com/profile/${angler.username}`;
    const text = `Check out ${angler.firstName} ${angler.lastName}'s fishing profile on Peg Slam!`;
    
    try {
      if (platform === 'whatsapp') {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(text + ' - ' + profileUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(waUrl, '_blank');
        } else {
          window.open(waUrl, '_blank');
        }
      } else if (platform === 'facebook') {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(fbUrl, '_blank');
        } else {
          window.open(fbUrl, '_blank');
        }
      } else if (platform === 'x') {
        const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        if ((window as any).cordova) {
          (window as any).cordova.InAppBrowser.open(xUrl, '_blank');
        } else {
          window.open(xUrl, '_blank');
        }
      } else if (platform === 'copy') {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(profileUrl).then(() => {
            Alert.alert('Success', 'Profile link copied to clipboard!');
          }).catch(() => {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = profileUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Alert.alert('Success', 'Profile link copied to clipboard!');
          });
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea');
          textarea.value = profileUrl;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          Alert.alert('Success', 'Profile link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Sharing error:', error);
      Alert.alert('Error', 'Failed to share profile. Please try again.');
    }
  };

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity style={styles.detailsBackButton} onPress={onClose}>
          <Text style={styles.detailsBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>{angler.firstName}</Text>
        <View style={{ width: 50 }} />
      </View>
      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.profileAvatarContainer}>
          {angler.avatar ? (
            <Image source={{ uri: angler.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
              <Text style={styles.profileAvatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{angler.firstName} {angler.lastName}</Text>
          <Text style={styles.profileUsername}>@{angler.username}</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Basic Information</Text>
          {angler.club && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Club</Text>
              <Text style={styles.detailRowValue}>{angler.club}</Text>
            </View>
          )}
          {angler.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Location</Text>
              <Text style={styles.detailRowValue}>{angler.location}</Text>
            </View>
          )}
          {angler.memberSince && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Member Since</Text>
              <Text style={styles.detailRowValue}>{new Date(angler.memberSince).getFullYear()}</Text>
            </View>
          )}
        </View>

        {/* Fishing Preferences */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Fishing Preferences</Text>
          {angler.favouriteMethod && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Favourite Method</Text>
              <Text style={styles.detailRowValue}>{angler.favouriteMethod}</Text>
            </View>
          )}
          {angler.favouriteSpecies && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Favourite Species</Text>
              <Text style={styles.detailRowValue}>{angler.favouriteSpecies}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {angler.bio && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>About</Text>
            <Text style={styles.detailsDescription}>{angler.bio}</Text>
          </View>
        )}

        {/* Stats Cards */}
        {statsLoading ? (
          <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
        ) : stats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Matches</Text>
              <Text style={styles.statValue}>{participations.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Wins</Text>
              <Text style={[styles.statValue, { color: '#1B7342' }]}>{stats.wins || 0}</Text>
              <Text style={styles.statSubtext}>{stats.podiumFinishes || 0} podium</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best Catch</Text>
              <Text style={styles.statValue}>{stats.bestCatch || '-'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Weight</Text>
              <Text style={styles.statValue}>{stats.averageWeight || '-'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Weight</Text>
              <Text style={styles.statValue}>{stats.totalWeight || '-'}</Text>
            </View>
          </View>
        ) : null}

        {/* Action Buttons */}
        {angler.username && (
          <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>
            <TouchableOpacity style={[styles.bookButton, { flex: 1, backgroundColor: '#1B7342' }]} onPress={() => setEditOpen(true)}>
              <Text style={styles.bookButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bookButton, { flex: 1, backgroundColor: '#555' }]} onPress={() => setSettingsOpen(true)}>
              <Text style={styles.bookButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Social Media Links */}
        {(angler.youtubeUrl || angler.facebookUrl || angler.twitterUrl || angler.instagramUrl || angler.tiktokUrl) && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Social Media</Text>
            <View style={styles.socialLinksContainer}>
              {angler.youtubeUrl && (
                <TouchableOpacity style={styles.socialButton} onPress={() => window.open(angler.youtubeUrl, '_blank')}>
                  <Text style={styles.socialButtonText}>▶ YouTube</Text>
                </TouchableOpacity>
              )}
              {angler.facebookUrl && (
                <TouchableOpacity style={styles.socialButton} onPress={() => window.open(angler.facebookUrl, '_blank')}>
                  <Text style={styles.socialButtonText}>f Facebook</Text>
                </TouchableOpacity>
              )}
              {angler.twitterUrl && (
                <TouchableOpacity style={styles.socialButton} onPress={() => window.open(angler.twitterUrl, '_blank')}>
                  <Text style={styles.socialButtonText}>𝕏 Twitter</Text>
                </TouchableOpacity>
              )}
              {angler.instagramUrl && (
                <TouchableOpacity style={styles.socialButton} onPress={() => window.open(angler.instagramUrl, '_blank')}>
                  <Text style={styles.socialButtonText}>📷 Instagram</Text>
                </TouchableOpacity>
              )}
              {angler.tiktokUrl && (
                <TouchableOpacity style={styles.socialButton} onPress={() => window.open(angler.tiktokUrl, '_blank')}>
                  <Text style={styles.socialButtonText}>♪ TikTok</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Share Profile */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Share Profile</Text>
          <View style={styles.shareButtonsContainer}>
            <TouchableOpacity style={styles.shareButton} onPress={() => shareProfile('whatsapp')}>
              <Text style={styles.shareButtonText}>💬 WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={() => shareProfile('facebook')}>
              <Text style={styles.shareButtonText}>f Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={() => shareProfile('x')}>
              <Text style={styles.shareButtonText}>𝕏 Twitter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={() => shareProfile('copy')}>
              <Text style={styles.shareButtonText}>🔗 Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsNavigation}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'upcoming' && styles.tabButtonTextActive]}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'gallery' && styles.tabButtonActive]}
              onPress={() => setActiveTab('gallery')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'gallery' && styles.tabButtonTextActive]}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'history' && (
            <View>
              <Text style={styles.tabTitle}>Competition History</Text>
              {participationsLoading ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : participations.filter((p: any) => getCompetitionStatus(p.competition) === 'completed').length === 0 ? (
                <Text style={styles.emptyTabText}>No competition history</Text>
              ) : (
                participations.filter((p: any) => getCompetitionStatus(p.competition) === 'completed').map((p: any) => (
                  <View key={p.id} style={styles.competitionRow}>
                    <Text style={styles.competitionName}>{p.competition.name}</Text>
                    <Text style={styles.competitionDetail}>{new Date(p.competition.date).toLocaleDateString('en-GB')}</Text>
                    <Text style={styles.competitionDetail}>{p.competition.venue} • Peg {p.pegNumber}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'upcoming' && (
            <View>
              <Text style={styles.tabTitle}>Upcoming Competitions</Text>
              {participationsLoading ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : participations.filter((p: any) => ['upcoming', 'live'].includes(getCompetitionStatus(p.competition))).length === 0 ? (
                <Text style={styles.emptyTabText}>No upcoming competitions</Text>
              ) : (
                participations.filter((p: any) => ['upcoming', 'live'].includes(getCompetitionStatus(p.competition))).map((p: any) => (
                  <View key={p.id} style={styles.competitionRow}>
                    <View style={styles.competitionRowTop}>
                      <Text style={styles.competitionName}>{p.competition.name}</Text>
                      <Text style={[styles.competitionBadge, getCompetitionStatus(p.competition) === 'live' && styles.competitionBadgeLive]}>
                        {getCompetitionStatus(p.competition).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.competitionDetail}>{new Date(p.competition.date).toLocaleDateString('en-GB')}</Text>
                    <Text style={styles.competitionDetail}>{p.competition.venue} • Peg {p.pegNumber}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'gallery' && (
            <View>
              <Text style={styles.tabTitle}>{angler.firstName}'s Gallery</Text>
              
              {/* Upload Photo Form */}
              <View style={styles.galleryUploadSection}>
                <TouchableOpacity style={styles.galleryUploadButton} onPress={async () => {
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                    });
                    if (!result.canceled && result.assets[0]) {
                      setGalleryForm({ photoUri: result.assets[0].uri, caption: '' });
                    }
                  } catch (error) {
                    Alert.alert('Error', 'Failed to pick image');
                  }
                }}>
                  <Text style={styles.galleryUploadButtonText}>+ Add Photo</Text>
                </TouchableOpacity>

                {galleryForm.photoUri && (
                  <View style={styles.galleryUploadPreview}>
                    <Image source={{ uri: galleryForm.photoUri }} style={styles.galleryUploadPreviewImage} />
                    <Text style={[styles.socialLabel, {marginTop: 12}]}>Caption (Optional)</Text>
                    <TextInput
                      style={styles.editInput}
                      placeholder="Add a caption..."
                      value={galleryForm.caption}
                      onChangeText={(text) => setGalleryForm({...galleryForm, caption: text})}
                      placeholderTextColor="#666"
                    />
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <TouchableOpacity style={[styles.settingsButton, { flex: 1 }]} onPress={() => setGalleryForm({ photoUri: '', caption: '' })}>
                        <Text style={styles.settingsButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.settingsButton, { flex: 1, backgroundColor: '#1B7342' }]} onPress={async () => {
                        try {
                          setGalleryLoading(true);
                          const formData = new FormData();
                          formData.append('image', { uri: galleryForm.photoUri, type: 'image/jpeg', name: 'photo.jpg' } as any);
                          formData.append('type', 'gallery');
                          
                          const uploadResponse = await fetch('https://pegslam.com/api/upload', {
                            method: 'POST',
                            body: formData,
                            headers: { 'Accept': 'application/json' },
                          });

                          const uploadData = await uploadResponse.json();
                          
                          await apiClient.post('/api/user/gallery', {
                            url: uploadData.url,
                            caption: galleryForm.caption || undefined,
                          });

                          Alert.alert('Success', 'Photo added to gallery!');
                          setGalleryForm({ photoUri: '', caption: '' });
                          fetchGallery();
                        } catch (error: any) {
                          Alert.alert('Error', error.message || 'Failed to upload photo');
                        } finally {
                          setGalleryLoading(false);
                        }
                      }}>
                        <Text style={styles.settingsButtonText}>Upload</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              {galleryLoading && !galleryForm.photoUri ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : gallery.length === 0 ? (
                <Text style={styles.emptyTabText}>No photos in gallery</Text>
              ) : (
                <View style={styles.galleryGrid}>
                  {gallery.map((photo: any) => (
                    <View key={photo.id} style={styles.galleryPhoto}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.galleryPhotoImage}
                        resizeMode="cover"
                      />
                      {photo.caption && (
                        <Text style={styles.galleryCaption}>{photo.caption}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <Text style={styles.editModalClose}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={async () => {
                try {
                  await apiClient.patch('/api/user/profile', editForm);
                  Alert.alert('Success', 'Profile updated!');
                  setEditOpen(false);
                } catch (error) {
                  Alert.alert('Error', 'Failed to update profile');
                }
              }}>
                <Text style={styles.editModalSave}>Save</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.editSection}>
                {/* Profile Picture */}
                <View style={styles.avatarUploadContainer}>
                  <Text style={styles.socialLabel}>Profile Picture</Text>
                  <View style={styles.avatarPreviewContainer}>
                    <View style={styles.avatarPreview}>
                      {avatarForm.photoUri ? (
                        <Image source={{ uri: avatarForm.photoUri }} style={styles.avatarPreviewImage} />
                      ) : editForm.avatar ? (
                        <Image source={{ uri: editForm.avatar }} style={styles.avatarPreviewImage} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarPlaceholderText}>{initials}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.avatarUploadButton} onPress={async () => {
                    try {
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setAvatarForm({ photoUri: result.assets[0].uri, uploading: false });
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Failed to pick image');
                    }
                  }}>
                    <Text style={styles.avatarUploadButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                  {avatarForm.photoUri && (
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                      <TouchableOpacity style={[styles.settingsButton, { flex: 1 }]} onPress={() => setAvatarForm({ photoUri: '', uploading: false })}>
                        <Text style={styles.settingsButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.settingsButton, { flex: 1, backgroundColor: '#1B7342' }]} onPress={async () => {
                        try {
                          setAvatarForm({ photoUri: avatarForm.photoUri, uploading: true });
                          const formData = new FormData();
                          formData.append('image', { uri: avatarForm.photoUri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
                          formData.append('type', 'avatar');
                          const uploadResponse = await fetch('https://pegslam.com/api/upload', {
                            method: 'POST',
                            body: formData,
                            headers: { 'Accept': 'application/json' },
                          });
                          const uploadData = await uploadResponse.json();
                          setEditForm({ ...editForm, avatar: uploadData.url });
                          setAvatarForm({ photoUri: '', uploading: false });
                          Alert.alert('Success', 'Profile picture updated!');
                        } catch (error: any) {
                          setAvatarForm({ photoUri: avatarForm.photoUri, uploading: false });
                          Alert.alert('Error', error.message || 'Failed to upload image');
                        }
                      }}>
                        <Text style={styles.settingsButtonText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                <Text style={styles.socialLabel}>First Name</Text>
                <TextInput style={styles.editInput} value={editForm.firstName} onChangeText={(text) => setEditForm({...editForm, firstName: text})} placeholder="First name" placeholderTextColor="#666" />
                
                <Text style={styles.socialLabel}>Last Name</Text>
                <TextInput style={styles.editInput} value={editForm.lastName} onChangeText={(text) => setEditForm({...editForm, lastName: text})} placeholder="Last name" placeholderTextColor="#666" />
                
                <Text style={styles.socialLabel}>Bio</Text>
                <TextInput style={[styles.editInput, { minHeight: 80 }]} value={editForm.bio} onChangeText={(text) => setEditForm({...editForm, bio: text})} placeholder="About you" placeholderTextColor="#666" multiline numberOfLines={4} />
                
                <Text style={styles.socialLabel}>Club</Text>
                <TextInput style={styles.editInput} value={editForm.club} onChangeText={(text) => setEditForm({...editForm, club: text})} placeholder="Fishing club" placeholderTextColor="#666" />
                
                <Text style={styles.socialLabel}>Location</Text>
                <TextInput style={styles.editInput} value={editForm.location} onChangeText={(text) => setEditForm({...editForm, location: text})} placeholder="City/Region" placeholderTextColor="#666" />
                
                <Text style={styles.socialLabel}>Favourite Method</Text>
                <TextInput style={styles.editInput} value={editForm.favouriteMethod} onChangeText={(text) => setEditForm({...editForm, favouriteMethod: text})} placeholder="e.g. Waggler, Feeder" placeholderTextColor="#666" />
                
                <Text style={styles.socialLabel}>Favourite Species</Text>
                <TextInput style={styles.editInput} value={editForm.favouriteSpecies} onChangeText={(text) => setEditForm({...editForm, favouriteSpecies: text})} placeholder="e.g. Carp, Bream" placeholderTextColor="#666" />
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={settingsOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContainer}>
            <View style={styles.editModalHeader}>
              <TouchableOpacity onPress={() => setSettingsOpen(false)}>
                <Text style={styles.editModalClose}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.editModalTitle}>Account Settings</Text>
              <View style={{ width: 50 }} />
            </View>
            <ScrollView style={styles.editModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.editSection}>
                <Text style={[styles.socialLabel, { fontSize: 16, fontWeight: 'bold', marginBottom: 16 }]}>Change Password</Text>
                
                <Text style={styles.socialLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor="#666"
                    secureTextEntry={!passwordForm.showCurrent}
                    value={passwordForm.currentPassword}
                    onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                  />
                  <TouchableOpacity onPress={() => setPasswordForm({...passwordForm, showCurrent: !passwordForm.showCurrent})}>
                    <Text style={styles.togglePasswordText}>{passwordForm.showCurrent ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.socialLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!passwordForm.showNew}
                    value={passwordForm.newPassword}
                    onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                  />
                  <TouchableOpacity onPress={() => setPasswordForm({...passwordForm, showNew: !passwordForm.showNew})}>
                    <Text style={styles.togglePasswordText}>{passwordForm.showNew ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.socialLabel}>Confirm Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!passwordForm.showConfirm}
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                  />
                  <TouchableOpacity onPress={() => setPasswordForm({...passwordForm, showConfirm: !passwordForm.showConfirm})}>
                    <Text style={styles.togglePasswordText}>{passwordForm.showConfirm ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.settingsButton, { marginTop: 16 }]} onPress={async () => {
                  if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
                    Alert.alert('Error', 'All fields are required');
                    return;
                  }
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    Alert.alert('Error', 'New passwords do not match');
                    return;
                  }
                  if (passwordForm.newPassword.length < 6) {
                    Alert.alert('Error', 'Password must be at least 6 characters');
                    return;
                  }
                  try {
                    await apiClient.put('/api/user/password', {
                      currentPassword: passwordForm.currentPassword,
                      newPassword: passwordForm.newPassword,
                    });
                    Alert.alert('Success', 'Password changed successfully!');
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '', showCurrent: false, showNew: false, showConfirm: false });
                    setSettingsOpen(false);
                  } catch (error: any) {
                    Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
                  }
                }}>
                  <Text style={styles.settingsButtonText}>Update Password</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Change Password Modal Component
function ChangePasswordModal({ visible, onClose }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/api/user/change-password', {
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.editModalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={loading}>
              <Text style={[styles.editModalSave, loading && { opacity: 0.5 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.editSection}>
              <View style={styles.passwordInputGroup}>
                <Text style={styles.socialLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter current password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                    <Text style={styles.togglePasswordText}>{showCurrentPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputGroup}>
                <Text style={styles.socialLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Text style={styles.togglePasswordText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.passwordInputGroup}>
                <Text style={styles.socialLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Text style={styles.togglePasswordText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.passwordHint}>Password must be at least 6 characters long</Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Edit Profile Modal Component
function EditProfileModal({ visible, user, onClose, onSave }: any) {
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [club, setClub] = useState(user.club || '');
  const [location, setLocation] = useState(user.location || '');
  const [favouriteMethod, setFavouriteMethod] = useState(user.favouriteMethod || '');
  const [favouriteSpecies, setFavouriteSpecies] = useState(user.favouriteSpecies || '');
  const [youtubeUrl, setYoutubeUrl] = useState(user.youtubeUrl || '');
  const [facebookUrl, setFacebookUrl] = useState(user.facebookUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(user.twitterUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(user.instagramUrl || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.patch('/api/user/profile', {
        firstName,
        lastName,
        bio,
        club,
        location,
        favouriteMethod,
        favouriteSpecies,
        youtubeUrl,
        facebookUrl,
        twitterUrl,
        instagramUrl,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      onSave({
        ...user,
        firstName,
        lastName,
        bio,
        club,
        location,
        favouriteMethod,
        favouriteSpecies,
        youtubeUrl,
        facebookUrl,
        twitterUrl,
        instagramUrl,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContainer}>
          <View style={styles.editModalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.editModalClose}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text style={[styles.editModalSave, loading && { opacity: 0.5 }]}>
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Basic Information</Text>
              <TextInput
                style={styles.editInput}
                placeholder="First Name"
                placeholderTextColor="#666"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Last Name"
                placeholderTextColor="#666"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                style={[styles.editInput, { height: 100 }]}
                placeholder="Bio"
                placeholderTextColor="#666"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Club"
                placeholderTextColor="#666"
                value={club}
                onChangeText={setClub}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Location"
                placeholderTextColor="#666"
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Fishing Preferences</Text>
              <TextInput
                style={styles.editInput}
                placeholder="Favourite Method"
                placeholderTextColor="#666"
                value={favouriteMethod}
                onChangeText={setFavouriteMethod}
              />
              <TextInput
                style={styles.editInput}
                placeholder="Favourite Species"
                placeholderTextColor="#666"
                value={favouriteSpecies}
                onChangeText={setFavouriteSpecies}
              />
            </View>

            <View style={styles.editSection}>
              <Text style={styles.editSectionTitle}>Social Media Links</Text>
              <View style={styles.socialInputGroup}>
                <Text style={styles.socialLabel}>YouTube</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="YouTube URL"
                  placeholderTextColor="#666"
                  value={youtubeUrl}
                  onChangeText={setYoutubeUrl}
                />
              </View>
              <View style={styles.socialInputGroup}>
                <Text style={styles.socialLabel}>Facebook</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Facebook URL"
                  placeholderTextColor="#666"
                  value={facebookUrl}
                  onChangeText={setFacebookUrl}
                />
              </View>
              <View style={styles.socialInputGroup}>
                <Text style={styles.socialLabel}>Twitter/X</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Twitter URL"
                  placeholderTextColor="#666"
                  value={twitterUrl}
                  onChangeText={setTwitterUrl}
                />
              </View>
              <View style={styles.socialInputGroup}>
                <Text style={styles.socialLabel}>Instagram</Text>
                <TextInput
                  style={styles.editInput}
                  placeholder="Instagram URL"
                  placeholderTextColor="#666"
                  value={instagramUrl}
                  onChangeText={setInstagramUrl}
                />
              </View>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// My Profile Page (for logged-in users)
function MyProfilePage({ user: initialUser, onLogout }: any) {
  const [user, setUser] = useState(initialUser);
  const initials = `${user.firstName?.[0] || 'U'}${user.lastName?.[0] || 'S'}`;
  const [stats, setStats] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [participations, setParticipations] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchGallery();
    fetchParticipations();
  }, [user.username]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get(`/api/users/${user.username}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchGallery = async () => {
    try {
      setGalleryLoading(true);
      const response = await apiClient.get(`/api/users/${user.username}/gallery`);
      setGallery(response.data || []);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchParticipations = async () => {
    try {
      setParticipationsLoading(true);
      const response = await apiClient.get(`/api/users/${user.username}/participations`);
      setParticipations(response.data || []);
    } catch (error) {
      console.error('Error fetching participations:', error);
    } finally {
      setParticipationsLoading(false);
    }
  };

  const getCompetitionStatus = (comp: any) => {
    const now = new Date();
    const start = new Date(comp.date);
    const end = new Date(comp.endDate || comp.date);
    
    if (now > end) return 'completed';
    if (now >= start && now <= end) return 'live';
    return 'upcoming';
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 10;
    if (user.firstName) completed++;
    if (user.lastName) completed++;
    if (user.bio) completed++;
    if (user.club) completed++;
    if (user.location) completed++;
    if (user.favouriteMethod) completed++;
    if (user.favouriteSpecies) completed++;
    if (user.youtubeUrl || user.facebookUrl || user.twitterUrl || user.instagramUrl) completed += 2;
    if (user.avatar) completed++;
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();
  const hasSocialLinks = user.youtubeUrl || user.facebookUrl || user.twitterUrl || user.instagramUrl;

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>My Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        {/* Avatar & Profile Header */}
        <View style={styles.profileAvatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={[styles.profileAvatar, styles.profileAvatarPlaceholder]}>
              <Text style={styles.profileAvatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.profileName}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.profileUsername}>@{user.username}</Text>

          {/* Profile Completion */}
          <View style={styles.completionContainer}>
            <View style={styles.completionBar}>
              <View 
                style={[
                  styles.completionFill,
                  { width: `${profileCompletion}%` }
                ]}
              />
            </View>
            <Text style={styles.completionText}>{profileCompletion}% Complete</Text>
          </View>
        </View>

        {/* Stats Cards */}
        {statsLoading ? (
          <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
        ) : stats ? (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Matches</Text>
              <Text style={styles.statValue}>{participations.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Wins</Text>
              <Text style={[styles.statValue, { color: '#1B7342' }]}>{stats.wins || 0}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Best</Text>
              <Text style={styles.statValue}>{stats.bestCatch || '-'}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{stats.averageWeight || '-'}</Text>
            </View>
          </View>
        ) : null}

        {/* Basic Info */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Basic Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailRowLabel}>Email</Text>
            <Text style={styles.detailRowValue}>{user.email}</Text>
          </View>
          {user.club && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Club</Text>
              <Text style={styles.detailRowValue}>{user.club}</Text>
            </View>
          )}
          {user.location && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Location</Text>
              <Text style={styles.detailRowValue}>{user.location}</Text>
            </View>
          )}
          {user.memberSince && (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Member Since</Text>
              <Text style={styles.detailRowValue}>{new Date(user.memberSince).getFullYear()}</Text>
            </View>
          )}
        </View>

        {/* Fishing Preferences */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsSectionTitle}>Fishing Preferences</Text>
          {user.favouriteMethod ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Favourite Method</Text>
              <Text style={styles.detailRowValue}>{user.favouriteMethod}</Text>
            </View>
          ) : (
            <Text style={styles.emptyFieldText}>Not added yet</Text>
          )}
          {user.favouriteSpecies ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailRowLabel}>Favourite Species</Text>
              <Text style={styles.detailRowValue}>{user.favouriteSpecies}</Text>
            </View>
          ) : (
            <Text style={styles.emptyFieldText}>Not added yet</Text>
          )}
        </View>

        {/* Bio */}
        {user.bio && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>About</Text>
            <Text style={styles.detailsDescription}>{user.bio}</Text>
          </View>
        )}

        {/* Social Media Links */}
        {hasSocialLinks && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsSectionTitle}>Social Media</Text>
            <View style={styles.socialLinksContainer}>
              {user.youtubeUrl && (
                <TouchableOpacity>
                  <Text style={styles.socialLinkText}>YouTube</Text>
                </TouchableOpacity>
              )}
              {user.facebookUrl && (
                <TouchableOpacity>
                  <Text style={styles.socialLinkText}>Facebook</Text>
                </TouchableOpacity>
              )}
              {user.twitterUrl && (
                <TouchableOpacity>
                  <Text style={styles.socialLinkText}>Twitter</Text>
                </TouchableOpacity>
              )}
              {user.instagramUrl && (
                <TouchableOpacity>
                  <Text style={styles.socialLinkText}>Instagram</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsNavigation}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'upcoming' && styles.tabButtonTextActive]}>Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'gallery' && styles.tabButtonActive]}
              onPress={() => setActiveTab('gallery')}
            >
              <Text style={[styles.tabButtonText, activeTab === 'gallery' && styles.tabButtonTextActive]}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'history' && (
            <View>
              <Text style={styles.tabTitle}>Competition History</Text>
              {participationsLoading ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : participations.filter((p: any) => getCompetitionStatus(p.competition) === 'completed').length === 0 ? (
                <Text style={styles.emptyTabText}>No competition history</Text>
              ) : (
                participations.filter((p: any) => getCompetitionStatus(p.competition) === 'completed').map((p: any) => (
                  <View key={p.id} style={styles.competitionRow}>
                    <Text style={styles.competitionName}>{p.competition.name}</Text>
                    <Text style={styles.competitionDetail}>{new Date(p.competition.date).toLocaleDateString('en-GB')}</Text>
                    <Text style={styles.competitionDetail}>{p.competition.venue} • Peg {p.pegNumber}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'upcoming' && (
            <View>
              <Text style={styles.tabTitle}>Upcoming Competitions</Text>
              {participationsLoading ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : participations.filter((p: any) => ['upcoming', 'live'].includes(getCompetitionStatus(p.competition))).length === 0 ? (
                <Text style={styles.emptyTabText}>No upcoming competitions</Text>
              ) : (
                participations.filter((p: any) => ['upcoming', 'live'].includes(getCompetitionStatus(p.competition))).map((p: any) => (
                  <View key={p.id} style={styles.competitionRow}>
                    <View style={styles.competitionRowTop}>
                      <Text style={styles.competitionName}>{p.competition.name}</Text>
                      <Text style={[styles.competitionBadge, getCompetitionStatus(p.competition) === 'live' && styles.competitionBadgeLive]}>
                        {getCompetitionStatus(p.competition).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.competitionDetail}>{new Date(p.competition.date).toLocaleDateString('en-GB')}</Text>
                    <Text style={styles.competitionDetail}>{p.competition.venue} • Peg {p.pegNumber}</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'gallery' && (
            <View>
              <Text style={styles.tabTitle}>My Gallery</Text>
              <TouchableOpacity style={styles.galleryUploadButton}>
                <Text style={styles.galleryUploadButtonText}>Add Photo to Gallery</Text>
              </TouchableOpacity>
              {galleryLoading ? (
                <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
              ) : gallery.length === 0 ? (
                <Text style={styles.emptyTabText}>No photos in gallery</Text>
              ) : (
                <View style={styles.galleryGrid}>
                  {gallery.map((photo: any) => (
                    <View key={photo.id} style={styles.galleryPhoto}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.galleryPhotoImage}
                        resizeMode="cover"
                      />
                      {photo.caption && (
                        <Text style={styles.galleryCaption}>{photo.caption}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'settings' && (
            <View style={styles.settingsSection}>
              <Text style={styles.tabTitle}>Settings</Text>
              <TouchableOpacity 
                style={styles.settingsButton}
                onPress={() => setShowPasswordModal(true)}
              >
                <Text style={styles.settingsButtonText}>Change Password</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedUser: any) => setUser(updatedUser)}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </View>
  );
}

// Main App
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null);
  const [selectedAngler, setSelectedAngler] = useState<any>(null);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [competitions, setCompetitions] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const [anglers, setAnglers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [anglersLoading, setAnglersLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [page, setPage] = useState(1);
  const [galleryFilter, setGalleryFilter] = useState('all');

  useEffect(() => {
    checkUser();
    fetchAllData();
  }, []);

  const checkUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const user = JSON.parse(token);
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setDataLoading(true);
      const [compRes, newsRes, galRes, anglersRes, spRes] = await Promise.all([
        apiClient.get('/api/competitions'),
        apiClient.get('/api/news'),
        apiClient.get('/api/gallery/featured').catch(() => ({ data: [] })),
        apiClient.get('/api/anglers?limit=100').catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/sponsors').catch(() => ({ data: [] })),
      ]);
      
      console.log('Competitions data:', compRes.data?.[0]);
      console.log('News data:', newsRes.data?.[0]);
      console.log('Gallery data:', galRes.data?.[0]);
      console.log('Anglers data:', anglersRes.data?.data?.[0]);
      console.log('Sponsors data:', spRes.data?.[0]);
      
      setCompetitions(compRes.data || []);
      setNews(newsRes.data || []);
      setGallery(galRes.data || []);
      setAnglers(anglersRes.data?.data || []);
      setSponsors(spRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAnglerSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleAnglerSort = (value: string) => {
    setSortBy(value);
    setPage(1);
  };

  const getFilteredAndSortedAnglers = () => {
    let filtered = anglers;
    
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter((a) =>
        a.firstName?.toLowerCase().includes(query) ||
        a.lastName?.toLowerCase().includes(query) ||
        a.username?.toLowerCase().includes(query) ||
        a.club?.toLowerCase().includes(query)
      );
    }

    const [sortField, sortOrder] = sortBy.split('-') as [string, 'asc' | 'desc'];
    
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      if (sortField === 'name') {
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
      } else if (sortField === 'memberSince') {
        aVal = new Date(a.memberSince).getTime();
        bVal = new Date(b.memberSince).getTime();
      } else {
        aVal = a[sortField as keyof typeof a];
        bVal = b[sortField as keyof typeof b];
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  };

  const getPageTitle = () => {
    const pageTitles: { [key: string]: string } = {
      'home': 'PEG SLAM',
      'competitions': 'Competitions',
      'leaderboard': 'Leaderboard',
      'anglers': 'Angler Directory',
      'news': 'News & Updates',
      'gallery': 'Gallery',
      'sponsors': 'Our Sponsors',
      'about': 'About Peg Slam',
      'contact': 'Contact Us',
    };
    return pageTitles[currentPage] || 'PEG SLAM';
  };

  const handleMenuSelect = (menuId: string) => {
    if (menuId === 'login') {
      setShowLoginModal(true);
    } else {
      setCurrentPage(menuId);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="#0a0a0a" />
        <ActivityIndicator size="large" color="#1B7342" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowDrawer(true)}>
          <Text style={styles.hamburger}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerLogo}>{getPageTitle()}</Text>
        <TouchableOpacity
          onPress={() => isLoggedIn ? setCurrentPage('profile') : setShowLoginModal(true)}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isLoggedIn ? '👤' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Competition Details View */}
      {selectedCompetition && (
        <CompetitionDetailsPage 
          competition={selectedCompetition} 
          onClose={() => setSelectedCompetition(null)} 
        />
      )}

      {/* Angler Profile View */}
      {selectedAngler && (
        <AnglerProfilePage 
          angler={selectedAngler} 
          onClose={() => setSelectedAngler(null)} 
        />
      )}

      {/* News Detail View */}
      {selectedNews && (
        <NewsDetailPage 
          article={selectedNews} 
          onClose={() => setSelectedNews(null)} 
        />
      )}

      {/* Main Content */}
      {!selectedCompetition && !selectedAngler && !selectedNews && (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <>
            <HeroCarousel />

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Competitions</Text>
              </View>
              {dataLoading ? (
                <ActivityIndicator size="large" color="#1B7342" />
              ) : competitions.length > 0 ? (
                <FlatList
                  data={competitions.slice(0, 3)}
                  renderItem={({ item }) => <CompetitionCard item={item} onViewDetails={() => setSelectedCompetition(item)} />}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No competitions available</Text>
              )}
            </View>

            <LeaderboardPage competitions={competitions} />

            {gallery.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured Gallery</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                  <View style={{ paddingHorizontal: 16, flexDirection: 'row' }}>
                    {gallery.slice(0, 4).map((img: any, idx: number) => {
                      // Gallery items have urls array, use first URL
                      const firstUrl = img.urls && img.urls.length > 0 ? img.urls[0] : null;
                      const imgUrl = firstUrl ? (firstUrl.startsWith('http') ? firstUrl : `${API_URL}${firstUrl}`) : null;
                      
                      console.log(`Gallery ${idx}:`, { title: img.title, firstUrl, imgUrl });
                      
                      return imgUrl ? (
                        <View key={idx} style={styles.galleryItem}>
                          <Image
                            source={{ uri: imgUrl }}
                            style={styles.galleryImage}
                            resizeMode="cover"
                            onError={(e) => console.log('Gallery image error:', imgUrl, e.nativeEvent.error)}
                          />
                        </View>
                      ) : null;
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Latest News</Text>
              </View>
              {dataLoading ? (
                <ActivityIndicator size="large" color="#1B7342" />
              ) : news.length > 0 ? (
                <FlatList
                  data={news.slice(0, 3)}
                  renderItem={({ item }) => <NewsCard item={item} onPress={setSelectedNews} />}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <Text style={styles.emptyText}>No news available</Text>
              )}
            </View>
          </>
        )}

        {/* COMPETITIONS PAGE */}
        {currentPage === 'competitions' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Competitions</Text>
            {dataLoading ? (
              <ActivityIndicator size="large" color="#1B7342" />
            ) : competitions.length > 0 ? (
              <FlatList
                data={competitions}
                renderItem={({ item }) => <CompetitionCard item={item} onViewDetails={() => setSelectedCompetition(item)} />}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>No competitions available</Text>
            )}
          </View>
        )}

        {/* LEADERBOARD PAGE */}
        {currentPage === 'leaderboard' && (
          <LeaderboardPage competitions={competitions} />
        )}

        {/* ANGLER DIRECTORY PAGE */}
        {currentPage === 'anglers' && (
          <AnglerDirectoryPage 
            anglers={getFilteredAndSortedAnglers()}
            loading={dataLoading}
            onSelectAngler={setSelectedAngler}
            onSearch={handleAnglerSearch}
            onSort={handleAnglerSort}
            search={search}
            sortBy={sortBy}
            page={page}
            onPageChange={setPage}
          />
        )}

        {/* NEWS PAGE */}
        {currentPage === 'news' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>News & Updates</Text>
            {dataLoading ? (
              <ActivityIndicator size="large" color="#1B7342" />
            ) : news.length > 0 ? (
              <FlatList
                data={news}
                renderItem={({ item }) => <NewsCard item={item} onPress={setSelectedNews} />}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <Text style={styles.emptyText}>No news available</Text>
            )}
          </View>
        )}

        {/* GALLERY PAGE */}
        {currentPage === 'gallery' && (
          <View style={styles.section}>
            <Text style={styles.gallerySubtitle}>Relive the best moments from our competitions - from epic catches to unforgettable events</Text>
            <View style={styles.galleryFilterTabs}>
              <TouchableOpacity style={[styles.galleryFilterTab, galleryFilter === 'all' && styles.galleryFilterTabActive]}>
                <Text style={[styles.galleryFilterTabText, galleryFilter === 'all' && styles.galleryFilterTabTextActive]}>All Photos</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.galleryFilterTab, galleryFilter === 'event' && styles.galleryFilterTabActive]}>
                <Text style={[styles.galleryFilterTabText, galleryFilter === 'event' && styles.galleryFilterTabTextActive]}>Events</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.galleryFilterTab, galleryFilter === 'catch' && styles.galleryFilterTabActive]}>
                <Text style={[styles.galleryFilterTabText, galleryFilter === 'catch' && styles.galleryFilterTabTextActive]}>Big Catches</Text>
              </TouchableOpacity>
            </View>
            {dataLoading ? (
              <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 40 }} />
            ) : gallery.length > 0 ? (
              <View style={styles.galleryCardGrid}>
                {gallery.slice(0, 8).map((item: any, idx: number) => (
                  <TouchableOpacity key={idx} style={styles.galleryCard} activeOpacity={0.7}>
                    <View style={styles.galleryCardImageContainer}>
                      <Image 
                        source={{ uri: item.urls && item.urls[0] ? item.urls[0] : 'https://via.placeholder.com/300x225' }} 
                        style={styles.galleryCardImage} 
                        resizeMode="cover" 
                      />
                      {item.urls && item.urls.length > 1 && (
                        <View style={styles.galleryCardBadge}>
                          <Text style={styles.galleryCardBadgeText}>{item.urls.length} images</Text>
                        </View>
                      )}
                      <View style={styles.galleryCardCategoryBadge}>
                        <Text style={styles.galleryCardCategoryText}>{item.category === 'catch' ? 'Catch' : 'Event'}</Text>
                      </View>
                    </View>
                    <View style={styles.galleryCardContent}>
                      <Text style={styles.galleryCardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.galleryCardDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyGalleryContainer}>
                <Text style={styles.emptyText}>No photos found</Text>
              </View>
            )}
          </View>
        )}

        {/* SPONSORS PAGE */}
        {currentPage === 'sponsors' && (
          <View style={styles.section}>
            <Text style={styles.sponsorHeaderText}>We're proud to work with the best brands and organizations in UK fishing. Their support makes Peg Slam competitions possible.</Text>
            
            {dataLoading ? (
              <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 40 }} />
            ) : sponsors.length > 0 ? (
              <View>
                {[
                  { tier: 'platinum', icon: '⭐', title: 'Platinum Sponsors' },
                  { tier: 'gold', icon: '🏆', title: 'Gold Sponsors' },
                  { tier: 'silver', icon: '🥈', title: 'Silver Sponsors' },
                  { tier: 'partner', icon: '🤝', title: 'Official Partners' },
                ].map((tierGroup) => {
                  const tierSponsors = sponsors.filter((s: any) => s.tier === tierGroup.tier);
                  if (tierSponsors.length === 0) return null;
                  return (
                    <View key={tierGroup.tier} style={styles.sponsorTierSection}>
                      <View style={styles.sponsorTierHeader}>
                        <Text style={styles.sponsorTierTitle}>{tierGroup.title}</Text>
                      </View>
                      {tierSponsors.map((sponsor: any) => (
                        <View key={sponsor.id} style={styles.sponsorListItem}>
                          <View style={styles.sponsorLogoContainer}>
                            {sponsor.logo ? (
                              <Image source={{ uri: sponsor.logo }} style={styles.sponsorLogo} resizeMode="contain" />
                            ) : (
                              <Text style={styles.sponsorLogoPlaceholder}>{sponsor.name[0]}</Text>
                            )}
                          </View>
                          <View style={styles.sponsorInfo}>
                            <Text style={styles.sponsorItemName}>{sponsor.name}</Text>
                            <Text style={styles.sponsorItemDesc} numberOfLines={2}>{sponsor.shortDescription || sponsor.description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.sponsorEmptyContainer}>
                <Text style={styles.emptyText}>No sponsors yet. Check back soon!</Text>
              </View>
            )}
            
            <View style={styles.sponsorWhySection}>
              <Text style={styles.sponsorWhyTitle}>Why Sponsor Peg Slam?</Text>
              <View style={styles.sponsorWhyCards}>
                {[
                  { title: 'Reach Your Audience', desc: 'Connect with dedicated match anglers and fishing enthusiasts' },
                  { title: 'Brand Visibility', desc: 'Showcase across digital platform and competition materials' },
                  { title: 'Community Support', desc: 'Support growth of competitive fishing in the UK' },
                  { title: 'Marketing Opportunities', desc: 'Social media exposure and direct engagement' },
                ].map((item, idx) => (
                  <View key={idx} style={styles.sponsorWhyCard}>
                    <Text style={styles.sponsorWhyCardTitle}>{item.title}</Text>
                    <Text style={styles.sponsorWhyCardDesc}>{item.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ABOUT PAGE */}
        {currentPage === 'about' && (
          <View style={styles.section}>
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutHeaderText}>A UK-based fishing competition organisation created to inspire anglers of all ages</Text>
            </View>
            
            <Text style={styles.aboutBodyText}>
              Peg Slam is a UK-based fishing competition organisation created to inspire anglers of all ages. The goal is simple — to bring together juniors, youth, and adults in a fair, friendly, and competitive environment that celebrates skill, respect, and community spirit.
            </Text>
            
            <Text style={styles.aboutBodyText}>
              What started as a small series of junior matches has grown into a national movement promoting angling as a positive outdoor activity that builds confidence, patience, and teamwork.
            </Text>
            
            <View style={styles.aboutValueCard}>
              <Text style={styles.aboutValueCardTitle}>What We Stand For</Text>
              <View style={styles.aboutValueList}>
                {[
                  'Fair competition – every peg, every angler, same opportunity.',
                  'Youth development – encouraging the next generation of anglers.',
                  'Community – connecting families, clubs, and fisheries across the UK.',
                  'Sustainability – promoting responsible fishing and environmental care.',
                ].map((item, idx) => (
                  <View key={idx} style={styles.aboutValueItem}>
                    <Text style={styles.aboutValueCheckmark}>✓</Text>
                    <Text style={styles.aboutValueItemText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <Text style={styles.aboutBodyText}>
              Peg Slam works alongside sponsors, fisheries, and volunteers to deliver safe, inclusive, and professionally run matches with real progression opportunities for every participant.
            </Text>
            
            <Text style={styles.aboutValuesTitle}>Peg Slam Values</Text>
            
            <View style={styles.aboutValuesGrid}>
              {[
                { title: 'Excellence', desc: 'Striving for high standards in every match and result.' },
                { title: 'Growth', desc: 'Creating opportunities for anglers to learn and progress.' },
                { title: 'Community', desc: 'Uniting anglers and fisheries across the UK.' },
                { title: 'Responsibility', desc: 'Championing fair play and environmental care.' },
              ].map((val, idx) => (
                <View key={idx} style={styles.aboutValueBox}>
                  <Text style={styles.aboutValueBoxTitle}>{val.title}</Text>
                  <Text style={styles.aboutValueBoxDesc}>{val.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* MY PROFILE PAGE */}
        {currentPage === 'profile' && currentUser && (
          <MyProfilePage user={currentUser} onLogout={handleLogout} />
        )}

        {/* CONTACT PAGE */}
        {currentPage === 'contact' && (
          <View style={styles.section}>
            <View style={styles.contactCard}>
              <Text style={styles.contactCardTitle}>Send Us a Message</Text>
              <TextInput style={styles.contactFormInput} placeholder="Your Name" placeholderTextColor="#666" />
              <TextInput style={styles.contactFormInput} placeholder="Your Email" placeholderTextColor="#666" keyboardType="email-address" />
              <TextInput style={[styles.contactFormInput, { height: 100 }]} placeholder="Your Message" placeholderTextColor="#666" multiline numberOfLines={4} textAlignVertical="top" />
              <TouchableOpacity style={styles.contactSubmitButton}>
                <Text style={styles.contactSubmitButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      )}

      {/* Side Drawer */}
      <SideDrawer
        visible={showDrawer}
        onClose={() => setShowDrawer(false)}
        onMenuSelect={handleMenuSelect}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(userData: any) => {
          setCurrentUser(userData);
          setIsLoggedIn(true);
          setShowLoginModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  hamburger: {
    fontSize: 28,
    color: '#1B7342',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B7342',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1B7342',
    borderRadius: 6,
  },
  headerButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    height: 280,
    backgroundColor: '#1a1a1a',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    padding: 20,
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  heroCTA: {
    backgroundColor: '#1B7342',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroCTAText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  competitionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  competitionImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#0a0a0a',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  competitionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  carouselContainer: {
    marginBottom: 20,
  },
  carouselSlide: {
    height: 280,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  carouselImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  carouselIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#0a0a0a',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a4a4a',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#1B7342',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardDetails: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#ddd',
  },
  priceValue: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: 'bold',
  },
  cardButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  cardButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  newsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#0a0a0a',
  },
  newsContent: {
    padding: 16,
  },
  newsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  newsCategory: {
    fontSize: 11,
    color: '#1B7342',
    fontWeight: '600',
    backgroundColor: 'rgba(74,222,128,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newsDate: {
    fontSize: 11,
    color: '#999',
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 12,
  },
  readMore: {
    color: '#1B7342',
    fontWeight: '600',
    fontSize: 13,
  },
  placeholderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 40,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  // Drawer Styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContent: {
    backgroundColor: '#1a1a1a',
    width: width * 0.75,
    height: '100%',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  drawerInner: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  drawerLogoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  drawerLogo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B7342',
  },
  drawerClose: {
    fontSize: 24,
    color: '#1B7342',
  },
  drawerMenu: {
    flex: 1,
    paddingVertical: 10,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  drawerMenuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  drawerMenuLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  drawerLoginButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  drawerLoginButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  drawerLogoutButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  drawerLogoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modalContent: {
    padding: 20,
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 28,
    color: '#1B7342',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderColor: '#2a2a2a',
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    marginBottom: 12,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#1B7342',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchText: {
    textAlign: 'center',
    color: '#1B7342',
    marginTop: 16,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  compSelector: {
    marginBottom: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  compSelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginRight: 8,
  },
  compSelectorButtonActive: {
    backgroundColor: '#1B7342',
    borderColor: '#1B7342',
  },
  compSelectorText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  compSelectorTextActive: {
    color: '#000',
  },
  leaderboardTable: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  leaderboardRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    alignItems: 'center',
  },
  leaderboardCell: {
    flex: 1,
    fontSize: 12,
    color: '#ddd',
    fontWeight: '500',
  },
  leaderboardCellWide: {
    flex: 1.5,
  },
  leaderboardHeader: {
    color: '#1B7342',
    fontWeight: 'bold',
    fontSize: 11,
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  detailsBackButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  detailsBackText: {
    color: '#1B7342',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  detailRowLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  detailRowValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  detailsDescription: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
  },
  bookButton: {
    backgroundColor: '#1B7342',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  galleryItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: 160,
    height: 160,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sortContainer: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  sortButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sortButtonActive: {
    backgroundColor: '#1B7342',
    borderColor: '#1B7342',
  },
  sortButtonText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#000',
  },
  anglersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  anglerCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  anglerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: '#1B7342',
    fontSize: 18,
    fontWeight: 'bold',
  },
  anglerName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  anglerUsername: {
    color: '#999',
    fontSize: 11,
    marginBottom: 6,
  },
  anglerClub: {
    color: '#1B7342',
    fontSize: 10,
    marginBottom: 2,
  },
  anglerLocation: {
    color: '#666',
    fontSize: 10,
    marginBottom: 2,
  },
  anglerSpecies: {
    color: '#666',
    fontSize: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    color: '#1B7342',
    fontSize: 12,
    fontWeight: '600',
  },
  paginationText: {
    color: '#999',
    fontSize: 12,
  },
  profileAvatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1B7342',
  },
  profileAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#1B7342',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    color: '#999',
    fontSize: 14,
  },
  // Stats Styles
  statsContainer: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statSubtext: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  // Social Media Styles
  socialLinksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  socialButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  socialButtonText: {
    color: '#1B7342',
    fontSize: 12,
    fontWeight: '600',
  },
  // Share Buttons Styles
  shareButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  shareButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Tabs Styles
  tabsContainer: {
    marginBottom: 24,
  },
  tabsNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#1B7342',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#1B7342',
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  emptyTabText: {
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
  competitionRow: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  competitionRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  competitionDetail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  competitionBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  competitionBadgeLive: {
    backgroundColor: '#1B7342',
    color: '#000',
  },
  // Gallery Grid Styles
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  galleryPhoto: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  galleryPhotoImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#1a1a1a',
  },
  galleryCaption: {
    fontSize: 11,
    color: '#999',
    padding: 8,
    backgroundColor: '#1a1a1a',
  },
  // Gallery Page Styles
  gallerySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  galleryFilterTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  galleryFilterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  galleryFilterTabActive: {
    borderBottomColor: '#1B7342',
  },
  galleryFilterTabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  galleryFilterTabTextActive: {
    color: '#1B7342',
  },
  galleryCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  galleryCardImageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#0a0a0a',
    position: 'relative',
  },
  galleryCardImage: {
    width: '100%',
    height: '100%',
  },
  galleryCardBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  galleryCardBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  galleryCardCategoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1B7342',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  galleryCardCategoryText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  galleryCardContent: {
    padding: 12,
  },
  galleryCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  galleryCardDesc: {
    color: '#999',
    fontSize: 12,
  },
  emptyGalleryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Sponsors Page Styles
  sponsorHeaderText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
    lineHeight: 20,
  },
  sponsorTierSection: {
    marginBottom: 24,
  },
  sponsorTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sponsorTierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sponsorListItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    alignItems: 'flex-start',
  },
  sponsorLogoContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#0a0a0a',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sponsorLogo: {
    width: 50,
    height: 50,
  },
  sponsorLogoPlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  sponsorInfo: {
    flex: 1,
  },
  sponsorItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  sponsorItemDesc: {
    color: '#999',
    fontSize: 12,
    lineHeight: 16,
  },
  sponsorEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  sponsorWhySection: {
    marginTop: 24,
  },
  sponsorWhyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  sponsorWhyCards: {
    gap: 12,
  },
  sponsorWhyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sponsorWhyCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B7342',
    marginBottom: 4,
  },
  sponsorWhyCardDesc: {
    fontSize: 12,
    color: '#999',
  },
  // About Page Styles
  aboutHeader: {
    marginBottom: 16,
  },
  aboutHeaderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  aboutBodyText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
    marginBottom: 16,
  },
  aboutValueCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  aboutValueCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  aboutValueList: {
    gap: 10,
  },
  aboutValueItem: {
    flexDirection: 'row',
    gap: 8,
  },
  aboutValueCheckmark: {
    color: '#1B7342',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: -2,
  },
  aboutValueItemText: {
    flex: 1,
    fontSize: 13,
    color: '#ddd',
    lineHeight: 18,
  },
  aboutValuesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  aboutValuesGrid: {
    gap: 12,
  },
  aboutValueBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  aboutValueBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1B7342',
    marginBottom: 6,
  },
  aboutValueBoxDesc: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  // Contact Page Styles
  contactCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  contactCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1B7342',
    marginBottom: 12,
  },
  contactInfoItem: {
    marginBottom: 12,
  },
  contactInfoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  contactInfoValue: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: '600',
  },
  contactFormInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 6,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  contactSubmitButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  contactSubmitButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  // Competition Details New Styles
  detailsImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  competitionModeRow: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  competitionModeLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  competitionDescription: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 22,
  },
  pegsRemainingBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  pegsRemainingFill: {
    height: '100%',
    backgroundColor: '#1B7342',
  },
  pegsRemainingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  // Tab Styles for Competition Details
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    marginVertical: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1B7342',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1B7342',
  },
  tabContent: {
    marginVertical: 16,
  },
  // Participant Styles
  participantsList: {
    marginVertical: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  participantAvatarContainer: {
    marginRight: 12,
  },
  participantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a2a2a',
  },
  participantAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B7342',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  participantClub: {
    fontSize: 12,
    color: '#999',
  },
  pegBadge: {
    backgroundColor: '#1B7342',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pegBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Auth Modal Styles (Login/Register)
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 32,
  },
  authLogoImage: {
    width: 200,
    height: 200,
  },
  logoTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1B7342',
    letterSpacing: 2,
  },
  logoSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B7342',
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ddd',
    marginBottom: 8,
  },
  authInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPasswordLink: {
    fontSize: 13,
    color: '#1B7342',
    fontWeight: '500',
  },
  authButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#999',
  },
  toggleLink: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  successContainer: {
    backgroundColor: '#1B7342',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  backButtonContainer: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  // Edit Profile Button
  editButtonText: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: '600',
  },
  // Profile Completion Styles
  completionContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  completionBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#2a2a2a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: '#1B7342',
  },
  completionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    marginTop: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  editModalClose: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  editModalSave: {
    fontSize: 14,
    color: '#1B7342',
    fontWeight: '600',
  },
  editModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // Edit Section Styles
  editSection: {
    marginBottom: 24,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  editInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  // Social Input Group
  socialInputGroup: {
    marginBottom: 16,
  },
  socialLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  socialLinkText: {
    backgroundColor: '#1B7342',
    color: '#000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontWeight: '600',
    fontSize: 13,
    overflow: 'hidden',
  },
  // Empty Field Text
  emptyFieldText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  // Password Input Styles
  passwordInputGroup: {
    marginBottom: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    color: '#fff',
    paddingVertical: 12,
    fontSize: 14,
  },
  togglePasswordText: {
    color: '#1B7342',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  // Settings Tab Styles
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  settingsButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  // Gallery Upload
  galleryUploadButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  galleryUploadButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  galleryUploadSection: {
    marginBottom: 16,
  },
  galleryUploadPreview: {
    marginTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  galleryUploadPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  // Avatar Upload Styles
  avatarUploadContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatarPreviewContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1B7342',
  },
  avatarPreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B7342',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000',
  },
  avatarUploadButton: {
    backgroundColor: '#1B7342',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  avatarUploadButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  avatarSaveButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1B7342',
  },
  avatarSaveButtonText: {
    color: '#1B7342',
    fontWeight: '600',
    fontSize: 14,
  },
});

// Styles for new sections
