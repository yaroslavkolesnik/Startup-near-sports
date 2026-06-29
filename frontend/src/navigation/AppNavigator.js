import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../screens/MapScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchDetailsScreen from '../screens/MatchDetailsScreen';
import PitchDetailsScreen from '../screens/PitchDetailsScreen';
import CreateMatchScreen from '../screens/CreateMatchScreen';
import EditMatchScreen from '../screens/EditMatchScreen';
import MyMatchesScreen from '../screens/MyMatchesScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CreatePitchScreen from '../screens/CreatePitchScreen';
import EditPitchScreen from '../screens/EditPitchScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordConfirmScreen from '../screens/ResetPasswordConfirmScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import MatchChatScreen from '../screens/MatchChatScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          ...theme.typography.headlineSmall,
        },
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceContainer,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: t('nav_map') }} 
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen} 
        options={{ title: t('nav_matches') }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: t('nav_profile') }} 
      />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordConfirmScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return userToken == null ? (
    <AuthStack />
  ) : (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTitleStyle: {
          ...theme.typography.headlineSmall,
        },
        headerTintColor: theme.colors.text,
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MatchDetails" 
        component={MatchDetailsScreen} 
        options={{ title: t('nav_match_details') }} 
      />
      <Stack.Screen 
        name="PitchDetails" 
        component={PitchDetailsScreen} 
        options={{ title: t('nav_pitch_details') }} 
      />
      <Stack.Screen 
        name="CreatePitch" 
        component={CreatePitchScreen} 
        options={{ title: t('nav_create_pitch') }} 
      />
      <Stack.Screen 
        name="EditPitch" 
        component={EditPitchScreen} 
        options={{ title: t('nav_edit_pitch') }} 
      />
      <Stack.Screen 
        name="CreateMatch" 
        component={CreateMatchScreen} 
        options={{ title: t('nav_create_match') }} 
      />
      <Stack.Screen 
        name="EditMatch" 
        component={EditMatchScreen} 
        options={{ title: t('nav_edit_match') }} 
      />
      <Stack.Screen 
        name="MyMatches" 
        component={MyMatchesScreen} 
        options={{ title: t('nav_my_matches') }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: t('nav_edit_profile') }} 
      />
      <Stack.Screen 
        name="PublicProfile" 
        component={PublicProfileScreen} 
        options={{ title: t('nav_public_profile') }} 
      />
      <Stack.Screen 
        name="MatchChat" 
        component={MatchChatScreen} 
        options={{ title: t('chat_title', 'Чат') }} 
      />
      <Stack.Screen 
        name="Feedback" 
        component={FeedbackScreen} 
        options={{ title: "Зв'язатися з адміністратором" }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen} 
        options={{ title: "Змінити пароль" }} 
      />
    </Stack.Navigator>
  );
}
