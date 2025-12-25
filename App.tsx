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
  Linking,
  Clipboard,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';

const API_URL = 'https://pegslam.com';
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51OkNT9CWRF6gYXTMFu18Bqv7h8lPJPHW8n4bQN5m1E8lDnOBm1y4l2QGmvKfB4Yp9WvFmPCnEJ5vP5X4SYnCjE9e00ZVF4zZqS';
const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Utility to strip HTML tags
const stripHtml = (html: string) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
};

// Sponsor tier display helper
const getTierInfo = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case 'platinum':
      return { label: 'Platinum', color: '#7B8894' };
    case 'gold':
      return { label: 'Gold', color: '#D4AF37' };
    case 'silver':
      return { label: 'Silver', color: '#C0C0C0' };
    case 'bronze':
      return { label: 'Bronze', color: '#CD7F32' };
    default:
      return { label: tier || 'Partner', color: '#1B7342' };
  }
};

function Header({ onOpenMenu, isLoggedIn, toggleRadio, isRadioPlaying }: any) {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    apiClient.get('/api/site-settings')
      .then(res => {
        let url = res.data?.logoUrl;
        if (url && !url.startsWith('http')) {
          url = API_URL + url;
        }
        setLogoUrl(url || '');
      })
      .catch(err => console.log('Logo fetch error:', err.message));
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => onOpenMenu('more')} style={styles.menuButton}>
          <Text style={styles.menuButtonIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerLogoContainer}>
          {logoUrl ? (
            <Image 
              source={{ uri: logoUrl }} 
              style={styles.headerLogo} 
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('./assets/logo.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          )}
        </View>
      </View>

      <View style={styles.headerRightSection}>
        <TouchableOpacity
          onPress={toggleRadio}
          style={[styles.radioButton, isRadioPlaying && styles.radioButtonActive]}
        >
          <Text style={styles.radioIcon}>{isRadioPlaying ? '⏹' : '📻'}</Text>
          {isRadioPlaying && <View style={styles.radioIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => isLoggedIn ? onOpenMenu('profile') : onOpenMenu('login')}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>
            {isLoggedIn ? '👤' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'competitions', label: 'Competitions', icon: '🎣' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'more', label: 'More', icon: '⋮' },
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

// Competition Card - Redesigned for better mobile UX
function CompetitionCard({ item, onViewDetails }: any) {
  const getImageUrl = () => {
    const url = item.thumbnailUrl || item.thumbnailUrlMd || item.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const imageUrl = getImageUrl();
  const pegsAvailable = item.pegsTotal - item.pegsBooked;
  const pegsPercentage = (item.pegsBooked / item.pegsTotal) * 100;
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#FF4444';
      case 'completed':
        return '#888';
      case 'upcoming':
        return '#1B7342';
      default:
        return '#666';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.competitionCard}
      onPress={() => onViewDetails(item)}
      activeOpacity={0.8}
    >
      {/* Image Container with Status Badge */}
      <View style={{ position: 'relative', marginBottom: 12 }}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.competitionImage, { height: 200, borderRadius: 12 }]}
            resizeMode="cover"
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />
        ) : (
          <View style={[styles.competitionImage, { height: 200, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderRadius: 12 }]}>
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>🎣</Text>
          </View>
        )}
        {item.status && (
          <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(item.status), top: 8, right: 8 }]}>
            <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Competition Info */}
      <Text style={[styles.competitionTitle, { marginBottom: 8, fontSize: 16, fontWeight: '600' }]} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Quick Info Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>📅 Date</Text>
          <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }}>{item.date || 'TBA'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>📍 Venue</Text>
          <Text style={{ fontSize: 13, color: '#fff', fontWeight: '500' }} numberOfLines={1}>{item.venue || 'N/A'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>💷 Fee</Text>
          <Text style={{ fontSize: 13, color: '#1B7342', fontWeight: '600' }}>£{item.entryFee || '0'}</Text>
        </View>
      </View>

      {/* Pegs Progress Bar */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: '#999' }}>Pegs Available</Text>
          <Text style={{ fontSize: 12, color: '#1B7342', fontWeight: '600' }}>{pegsAvailable}/{item.pegsTotal}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden' }}>
          <View 
            style={{ 
              height: '100%', 
              backgroundColor: pegsPercentage > 80 ? '#FF4444' : '#1B7342',
              width: `${pegsPercentage}%`
            }} 
          />
        </View>
      </View>

      {/* Prize Pool & Type Row */}
      {(item.prizePool || item.prizeType) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          {item.prizePool && (
            <View style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>🏆 Prize Pool</Text>
              <Text style={{ fontSize: 13, color: '#1B7342', fontWeight: '600' }}>£{item.prizePool}</Text>
            </View>
          )}
          {item.prizeType && (
            <View style={{ flex: 1, backgroundColor: '#1a1a1a', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>🎯 Type</Text>
              <Text style={{ fontSize: 13, color: '#fff' }}>{item.prizeType}</Text>
            </View>
          )}
        </View>
      )}

      {/* View Details Button */}
      <TouchableOpacity style={[styles.cardButton, { backgroundColor: '#1B7342', paddingVertical: 12 }]} onPress={() => onViewDetails(item)}>
        <Text style={[styles.cardButtonText, { fontSize: 14, fontWeight: '600' }]}>View Details →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
function LeaderboardPage({ competitions, onTeamClick }: any) {
  const [selectedCompId, setSelectedCompId] = useState(competitions?.[0]?.id || '');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);
  const [mode, setMode] = useState('individual');

  const fetchLeaderboard = async (id: string) => {
    try {
      setLeaderLoading(true);
      const res = await apiClient.get(`/api/competitions/${id}/leaderboard`);
      setLeaderboardData(res.data || []);
      
      const comp = competitions.find((c: any) => c.id === id);
      if (comp) setMode(comp.competitionMode || 'individual');
    } catch (err) {
      console.log('Leaderboard fetch error:', err);
    } finally {
      setLeaderLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompId) {
      fetchLeaderboard(selectedCompId);
    }
  }, [selectedCompId]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Global Leaderboards</Text>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {competitions.filter((c: any) => c.status === 'live' || c.status === 'completed').map((comp: any) => (
          <TouchableOpacity 
            key={comp.id}
            style={[styles.tab, selectedCompId === comp.id && styles.tabActive, { minWidth: 120, marginRight: 8 }]}
            onPress={() => setSelectedCompId(comp.id)}
          >
            <Text style={[styles.tabText, selectedCompId === comp.id && styles.tabTextActive]} numberOfLines={1}>{comp.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.contactCard}>
        <View style={[styles.teamMemberRow, { borderBottomWidth: 1, borderColor: '#2a2a2a', paddingBottom: 8 }]}>
          <Text style={[styles.navLabel, { width: 30 }]}>Pos</Text>
          <Text style={[styles.navLabel, { flex: 1 }]}>{mode === 'team' ? 'Team' : 'Angler'}</Text>
          <Text style={[styles.navLabel, { width: 60, textAlign: 'right' }]}>Weight</Text>
        </View>

        {leaderLoading ? (
          <ActivityIndicator size="small" color="#1B7342" style={{ marginVertical: 20 }} />
        ) : leaderboardData.length > 0 ? (
          leaderboardData.map((entry, i) => (
            <View key={i} style={styles.teamMemberRow}>
              <Text style={{ color: i < 3 ? '#1B7342' : '#fff', width: 30, fontWeight: 'bold' }}>{i + 1}</Text>
              <Text style={{ color: '#fff', flex: 1 }} numberOfLines={1}>{entry.name}</Text>
              <Text style={{ color: '#1B7342', width: 60, textAlign: 'right', fontWeight: 'bold' }}>{entry.weight}kg</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { padding: 20 }]}>No data available</Text>
        )}
      </View>
    </View>
  );
}

const LeaderboardSection = ({ competitions }: { competitions: any[] }) => {
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderLoading, setLeaderLoading] = useState(false);

  const getCompetitionStatus = (compId: string) => {
    const comp = competitions.find((c: any) => c.id === compId);
    if (!comp) return 'unknown';
    const compDate = new Date(comp.date);
    const now = new Date();
    if (compDate < now) return 'completed';
    return 'upcoming';
  };

  // Show message if no competitions available
  if (!competitions || competitions.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>No competitions available</Text>
        </View>
      </View>
    );
  }

  // Filter to only live/completed
  const filteredComps = competitions.filter((c: any) => {
    const compDate = new Date(c.date);
    const now = new Date();
    return compDate < now; // Only completed
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (filteredComps.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>No completed competitions yet</Text>
        </View>
      </View>
    );
  }

  const selectedStatus = getCompetitionStatus(selectedCompId);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Leaderboard</Text>
      
      {/* Competition Selector with Status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compSelector}>
        {filteredComps.map((comp: any) => (
          <TouchableOpacity
            key={comp.id}
            style={[
              styles.compSelectorButton,
              selectedCompId === comp.id && styles.compSelectorButtonActive,
            ]}
            onPress={() => setSelectedCompId(comp.id)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={[
                  styles.compSelectorText,
                  selectedCompId === comp.id && styles.compSelectorTextActive,
                ]}
                numberOfLines={1}
              >
                {comp.name}
              </Text>
              <View style={[styles.compStatusBadge, { backgroundColor: comp.status === 'live' ? '#FF4444' : '#888', marginLeft: 6 }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{comp.status === 'live' ? 'LIVE' : 'DONE'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leaderboard Table */}
      {leaderLoading ? (
        <ActivityIndicator size="large" color="#1B7342" style={{ marginVertical: 20 }} />
      ) : leaderboardData.length > 0 ? (
        <View style={{ marginVertical: 12, borderRadius: 8, overflow: 'hidden' }}>
          {/* Table Header */}
          <View style={[styles.leaderboardHeaderRow, { backgroundColor: '#1a1a1a', borderBottomWidth: 2, borderBottomColor: '#1B7342' }]}>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.4 }]}>Pos</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 1.2 }]}>Angler</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.6 }]}>User</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.6 }]}>Club</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.5 }]}>Peg</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.4 }]}>Fish</Text>
            <Text style={[styles.leaderboardCell, styles.leaderboardHeader, { flex: 0.5 }]}>Wgt</Text>
          </View>
          {/* Table Rows - Show ALL entries, not just 20 */}
          {leaderboardData.map((entry: any, idx: number) => (
            <View key={idx} style={[styles.leaderboardRow, { backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(27, 115, 66, 0.05)' }]}>
              <Text style={[styles.leaderboardCell, { flex: 0.4, fontWeight: 'bold' }]}>{entry.position || idx + 1}</Text>
              {entry.isTeam ? (
                <TouchableOpacity 
                  style={[styles.leaderboardCell, { flex: 1.2, flexDirection: 'row', alignItems: 'center' }]}
                  onPress={() => onTeamClick && onTeamClick(entry.teamId)}
                >
                  <Text style={[styles.teamNameText, { flex: 1 }]} numberOfLines={1}>
                    {entry.anglerName || entry.teamName || 'Team'}
                  </Text>
                  <Text style={styles.teamIcon}>[T]</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.leaderboardCell, { flex: 1.2 }]} numberOfLines={1}>
                  {entry.anglerName || 'Unknown'}
                </Text>
              )}
              <Text style={[styles.leaderboardCell, { flex: 0.6 }]} numberOfLines={1}>{entry.username || '-'}</Text>
              <Text style={[styles.leaderboardCell, { flex: 0.6 }]} numberOfLines={1}>{entry.club ? entry.club.substring(0, 3) : '-'}</Text>
              <Text style={[styles.leaderboardCell, { flex: 0.5 }]}>{entry.pegNumber || '-'}</Text>
              <Text style={[styles.leaderboardCell, { flex: 0.4, color: entry.fishCount > 0 ? '#1B7342' : '#999' }]}>{entry.fishCount || 0}</Text>
              <Text style={[styles.leaderboardCell, { flex: 0.5, fontWeight: '600' }]}>{entry.weight || '0'}</Text>
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
function CompetitionDetailsPage({ competition, onClose, onTeamClick, user, onLogin }: any) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [joiningLeaving, setJoiningLeaving] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showJoinTeamModal, setShowJoinTeamModal] = useState(false);
  const [showManageTeamModal, setShowManageTeamModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [joiningTeam, setJoiningTeam] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isTeamCompetition = competition.competitionMode === 'team';
  const entryFee = parseFloat(competition.entryFee) || 0;
  const isPaidCompetition = entryFee > 0;

  const fetchCompetitionDetails = async () => {
    try {
      setLoadingParticipants(true);
      const res = await apiClient.get(`/api/competitions/${competition.id}/participants`);
      setParticipants(res.data || []);
      
      if (user) {
        const joined = res.data.some((p: any) => p.userId === user.id);
        setIsJoined(joined);
      }
    } catch (err) {
      console.log('Error fetching participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const res = await apiClient.get(`/api/competitions/${competition.id}/leaderboard`);
      setLeaderboard(res.data || []);
    } catch (err) {
      console.log('Error fetching leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchCompetitionDetails();
    fetchLeaderboard();
  }, [competition.id]);

  const handleBookPeg = () => {
    if (!user) {
      onLogin();
      return;
    }
    setShowBookingModal(true);
  };

  const getImageUrl = () => {
    const url = competition.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const imageUrl = getImageUrl();

  return (
    <Modal visible={true} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.editModalHeader}>
          <Text style={styles.editModalTitle} numberOfLines={1}>{competition.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.editModalClose}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalContent}>
          <View style={styles.detailsImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View style={{ width: '100%', height: 200, backgroundColor: '#1a1a1a', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 40 }}>🎣</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: competition.status === 'live' ? '#FF4444' : '#1B7342' }]}>
              <Text style={styles.statusBadgeText}>{competition.status?.toUpperCase() || 'UPCOMING'}</Text>
            </View>
          </View>

          <View style={styles.competitionModeRow}>
            <Text style={styles.competitionModeLabel}>
              Mode: <Text style={{ color: '#fff' }}>{competition.competitionMode === 'team' ? '👥 Team' : '👤 Individual'}</Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.competitionDescription}>{stripHtml(competition.description)}</Text>
          </View>

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

          {activeTab === 'details' && (
            <View style={styles.tabContent}>
              <View style={styles.contactCard}>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Venue</Text>
                  <Text style={styles.contactInfoValue}>{competition.venue}</Text>
                </View>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Date</Text>
                  <Text style={styles.contactInfoValue}>{competition.date}</Text>
                </View>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Entry Fee</Text>
                  <Text style={styles.contactInfoValue}>£{competition.entryFee}</Text>
                </View>
                {competition.prizePool && (
                  <View style={styles.contactInfoItem}>
                    <Text style={styles.contactInfoLabel}>Prize Pool</Text>
                    <Text style={styles.contactInfoValue}>£{competition.prizePool}</Text>
                  </View>
                )}
              </View>

              {!isJoined && competition.status !== 'completed' && (
                <TouchableOpacity style={styles.authButton} onPress={handleBookPeg}>
                  <Text style={styles.authButtonText}>Book Peg Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'participants' && (
            <View style={styles.tabContent}>
              {loadingParticipants ? (
                <ActivityIndicator size="small" color="#1B7342" />
              ) : participants.length > 0 ? (
                participants.map((p, i) => (
                  <View key={i} style={styles.participantCard}>
                    <View style={styles.participantAvatarPlaceholder}>
                      <Text style={styles.participantAvatarText}>{p.user?.firstName?.charAt(0) || '?'}</Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{p.user?.firstName} {p.user?.lastName}</Text>
                      <Text style={styles.participantClub}>{p.team?.name || 'Individual'}</Text>
                    </View>
                    <View style={styles.pegBadge}>
                      <Text style={styles.pegBadgeText}>Peg {p.pegNumber}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No participants yet</Text>
              )}
            </View>
          )}

          {activeTab === 'leaderboard' && (
            <View style={styles.tabContent}>
              {loadingLeaderboard ? (
                <ActivityIndicator size="small" color="#1B7342" />
              ) : leaderboard.length > 0 ? (
                leaderboard.map((entry, i) => (
                  <View key={i} style={styles.participantCard}>
                    <Text style={[styles.participantAvatarText, { marginRight: 12, color: '#1B7342' }]}>{i + 1}</Text>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{entry.name}</Text>
                      <Text style={styles.participantClub}>{entry.weight}kg</Text>
                    </View>
                    {entry.pegNumber && (
                      <View style={styles.pegBadge}>
                        <Text style={styles.pegBadgeText}>Peg {entry.pegNumber}</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Leaderboard not available yet</Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getCompetitionStatus = (competition: any) => {
  if (!competition.date) return 'upcoming';
  const compDate = new Date(competition.date);
  const now = new Date();
  if (compDate < now) return 'completed';
  return 'upcoming';
};

function CompetitionDetailsModal({ competition, onClose, user, onLogin }: any) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const isTeamCompetition = competition.competitionMode === 'team';
  const entryFee = parseFloat(competition.entryFee) || 0;
  const isPaidCompetition = entryFee > 0;

  useEffect(() => {
    checkIsJoined();
    if (isTeamCompetition && user) {
      fetchUserTeam();
      fetchAllTeams();
    }
  }, [user, competition.id]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeTab === 'participants') {
      fetchParticipants();
    }
  }, [activeTab]);

  const checkIsJoined = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/api/competitions/${competition.id}/is-joined`);
      setIsJoined(response.data?.isJoined || false);
    } catch (error) {
      console.error('Error checking join status:', error);
    }
  };

  const fetchUserTeam = async () => {
    if (!user) return;
    try {
      const response = await apiClient.get(`/api/competitions/${competition.id}/my-team`);
      setUserTeam(response.data || null);
    } catch (error) {
      console.error('Error fetching user team:', error);
      setUserTeam(null);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const response = await apiClient.get(`/api/competitions/${competition.id}/teams`);
      setAllTeams(response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

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

  const getImageUrl = () => {
    const url = competition.imageUrl;
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const imageUrl = getImageUrl();
  const status = getCompetitionStatus(competition);
  const pegsRemaining = competition.pegsTotal - competition.pegsBooked;

  const handleBookPeg = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to book a peg', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => onLogin && onLogin() }
      ]);
      return;
    }
    setShowBookingModal(true);
  };

  const handleFreeJoin = async () => {
    try {
      const response = await apiClient.post(`/api/competitions/${competition.id}/join`, {
        pegNumber: Math.floor(Math.random() * competition.pegsTotal) + 1
      });
      if (response.data) {
        Alert.alert('Success', 'You have joined the competition!');
        checkIsJoined();
        fetchParticipants();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join competition');
    }
  };

  return (
    <Modal visible={true} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.editModalHeader}>
          <Text style={styles.editModalTitle} numberOfLines={1}>{competition.name}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.editModalClose}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.editModalContent}>
          <View style={styles.detailsImageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
            ) : (
              <View style={{ width: '100%', height: 200, backgroundColor: '#1a1a1a', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 40 }}>🎣</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: competition.status === 'live' ? '#FF4444' : '#1B7342' }]}>
              <Text style={styles.statusBadgeText}>{competition.status?.toUpperCase() || status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.competitionModeRow}>
            <Text style={styles.competitionModeLabel}>
              Mode: <Text style={{ color: '#fff' }}>{competition.competitionMode === 'team' ? '👥 Team' : '👤 Individual'}</Text>
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.competitionDescription}>{stripHtml(competition.description)}</Text>
          </View>

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

          {activeTab === 'details' && (
            <View style={styles.tabContent}>
              <View style={styles.contactCard}>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Venue</Text>
                  <Text style={styles.contactInfoValue}>{competition.venue}</Text>
                </View>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Date</Text>
                  <Text style={styles.contactInfoValue}>{competition.date}</Text>
                </View>
                <View style={styles.contactInfoItem}>
                  <Text style={styles.contactInfoLabel}>Entry Fee</Text>
                  <Text style={styles.contactInfoValue}>£{competition.entryFee}</Text>
                </View>
              </View>

              {!isJoined && competition.status !== 'completed' && (
                <TouchableOpacity style={styles.authButton} onPress={handleBookPeg}>
                  <Text style={styles.authButtonText}>Book Peg Now</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'participants' && (
            <View style={styles.tabContent}>
              {loadingParticipants ? (
                <ActivityIndicator size="small" color="#1B7342" />
              ) : participants.length > 0 ? (
                participants.map((p, i) => (
                  <View key={i} style={styles.participantCard}>
                    <View style={styles.participantAvatarPlaceholder}>
                      <Text style={styles.participantAvatarText}>{p.user?.firstName?.charAt(0) || '?'}</Text>
                    </View>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{p.user?.firstName} {p.user?.lastName}</Text>
                      <Text style={styles.participantClub}>{p.team?.name || 'Individual'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No participants yet</Text>
              )}
            </View>
          )}

          {activeTab === 'leaderboard' && (
            <View style={styles.tabContent}>
              {loadingLeaderboard ? (
                <ActivityIndicator size="small" color="#1B7342" />
              ) : leaderboard.length > 0 ? (
                leaderboard.map((entry, i) => (
                  <View key={i} style={styles.participantCard}>
                    <Text style={[styles.participantAvatarText, { marginRight: 12, color: '#1B7342' }]}>{i + 1}</Text>
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{entry.name}</Text>
                      <Text style={styles.participantClub}>{entry.weight}kg</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Leaderboard not available yet</Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// Main App Component
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMoreModal, setShowMoreModal] = useState(false);

  useEffect(() => {
    checkAuth();
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

  const handleLogin = (userData: any) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setShowProfileModal(false);
  };

  const toggleRadio = () => {
    setIsRadioPlaying(!isRadioPlaying);
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
        onOpenMenu={(menu: string) => {
          if (menu === 'login') setShowLoginModal(true);
          else if (menu === 'profile') setShowProfileModal(true);
          else if (menu === 'more') setShowMoreModal(true);
        }}
        isLoggedIn={!!user}
        toggleRadio={toggleRadio}
        isRadioPlaying={isRadioPlaying}
      />
      
      <View style={styles.content}>
        {activeTab === 'home' && <ScrollView><Text style={{color: '#fff'}}>Home Content</Text></ScrollView>}
        {activeTab === 'competitions' && <ScrollView><Text style={{color: '#fff'}}>Competitions Content</Text></ScrollView>}
        {activeTab === 'leaderboard' && <ScrollView><Text style={{color: '#fff'}}>Leaderboard Content</Text></ScrollView>}
        {activeTab === 'news' && <ScrollView><Text style={{color: '#fff'}}>News Content</Text></ScrollView>}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity 
            key={tab.id} 
            style={styles.tabItem} 
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabIcon, activeTab === tab.id && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 15,
  },
  menuButtonIcon: {
    fontSize: 24,
    color: '#fff',
  },
  headerLogoContainer: {
    width: 100,
    height: 40,
  },
  headerLogo: {
    width: '100%',
    height: '100%',
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    marginRight: 15,
    padding: 5,
  },
  radioButtonActive: {
    backgroundColor: '#1B7342',
    borderRadius: 5,
  },
  radioIcon: {
    fontSize: 20,
  },
  radioIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0',
  },
  headerButton: {
    padding: 5,
  },
  headerButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#333',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    color: '#888',
  },
  tabIconActive: {
    color: '#1B7342',
  },
  tabLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1B7342',
  },
  // Adding placeholders for missing styles referenced in previous snippets
  detailsContainer: { flex: 1 },
  detailsHeader: { flexDirection: 'row', padding: 10 },
  detailsBackButton: { padding: 5 },
  detailsBackText: { color: '#fff' },
  detailsTitle: { color: '#fff', fontSize: 18 },
  detailsContent: { flex: 1 },
});

export default App;
