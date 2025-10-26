/**
 * 📱 LA TANDA MOBILE APP CONFIGURATION
 * Platform-specific configurations and setup utilities for mobile applications
 */

class LaTandaMobileConfig {
    constructor() {
        this.environments = {
            development: {
                apiBaseURL: 'http://localhost:3001',
                wsBaseURL: 'ws://localhost:3001',
                debug: true,
                logLevel: 'debug'
            },
            staging: {
                apiBaseURL: 'https://api-staging.latanda.online',
                wsBaseURL: 'wss://api-staging.latanda.online',
                debug: true,
                logLevel: 'info'
            },
            production: {
                apiBaseURL: 'https://api.latanda.online',
                wsBaseURL: 'wss://api.latanda.online',
                debug: false,
                logLevel: 'error'
            }
        };
        
        this.currentEnvironment = 'development';
        this.platformConfigs = this.initializePlatformConfigs();
    }
    
    initializePlatformConfigs() {
        return {
            'react-native': {
                name: 'React Native',
                dependencies: [
                    '@react-native-async-storage/async-storage',
                    'react-native-device-info',
                    '@react-native-firebase/messaging',
                    'react-native-keychain',
                    'react-native-biometrics',
                    'react-native-camera',
                    '@react-native-picker/picker'
                ],
                permissions: [
                    'android.permission.CAMERA',
                    'android.permission.WRITE_EXTERNAL_STORAGE',
                    'android.permission.ACCESS_NETWORK_STATE',
                    'android.permission.INTERNET',
                    'android.permission.VIBRATE',
                    'android.permission.USE_BIOMETRIC',
                    'android.permission.USE_FINGERPRINT'
                ],
                setup: this.getReactNativeSetup(),
                example: this.getReactNativeExample()
            },
            
            'flutter': {
                name: 'Flutter',
                dependencies: [
                    'shared_preferences',
                    'device_info_plus',
                    'firebase_messaging',
                    'flutter_secure_storage',
                    'local_auth',
                    'camera',
                    'http',
                    'path_provider'
                ],
                permissions: [
                    'android.permission.CAMERA',
                    'android.permission.WRITE_EXTERNAL_STORAGE',
                    'android.permission.ACCESS_NETWORK_STATE',
                    'android.permission.INTERNET',
                    'android.permission.VIBRATE',
                    'android.permission.USE_BIOMETRIC',
                    'android.permission.USE_FINGERPRINT'
                ],
                setup: this.getFlutterSetup(),
                example: this.getFlutterExample()
            },
            
            'cordova': {
                name: 'Cordova/PhoneGap',
                plugins: [
                    'cordova-plugin-device',
                    'cordova-plugin-network-information',
                    'cordova-plugin-statusbar',
                    'cordova-plugin-splashscreen',
                    'cordova-plugin-camera',
                    'cordova-plugin-file',
                    'cordova-plugin-firebase-messaging',
                    'cordova-plugin-touch-id'
                ],
                permissions: [
                    'android.permission.CAMERA',
                    'android.permission.WRITE_EXTERNAL_STORAGE',
                    'android.permission.ACCESS_NETWORK_STATE',
                    'android.permission.INTERNET',
                    'android.permission.VIBRATE'
                ],
                setup: this.getCordovaSetup(),
                example: this.getCordovaExample()
            },
            
            'capacitor': {
                name: 'Capacitor',
                plugins: [
                    '@capacitor/device',
                    '@capacitor/network',
                    '@capacitor/status-bar',
                    '@capacitor/splash-screen',
                    '@capacitor/camera',
                    '@capacitor/filesystem',
                    '@capacitor/push-notifications',
                    '@capacitor/biometric-auth'
                ],
                setup: this.getCapacitorSetup(),
                example: this.getCapacitorExample()
            }
        };
    }
    
    // Environment management
    setEnvironment(env) {
        if (this.environments[env]) {
            this.currentEnvironment = env;
            console.log(`📱 Environment set to: ${env}`);
            return this.getEnvironmentConfig();
        }
        throw new Error(`Unknown environment: ${env}`);
    }
    
    getEnvironmentConfig() {
        return this.environments[this.currentEnvironment];
    }
    
    // Platform-specific setup instructions
    getReactNativeSetup() {
        return `
# React Native Setup for La Tanda

## 1. Install Dependencies
npm install --save @react-native-async-storage/async-storage react-native-device-info @react-native-firebase/messaging react-native-keychain react-native-biometrics react-native-camera @react-native-picker/picker

## 2. iOS Setup (ios/Podfile)
cd ios && pod install

## 3. Android Setup (android/app/build.gradle)
Add permissions to android/app/src/main/AndroidManifest.xml:
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

## 4. Firebase Setup
- Add google-services.json to android/app/
- Add GoogleService-Info.plist to ios/

## 5. Initialize La Tanda API
import { LaTandaMobileAPI } from './path/to/mobile-api-integration';

const laTandaAPI = new LaTandaMobileAPI({
    baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
    debug: ${this.getEnvironmentConfig().debug}
});
`;
    }
    
    getFlutterSetup() {
        return `
# Flutter Setup for La Tanda

## 1. Add Dependencies (pubspec.yaml)
dependencies:
  shared_preferences: ^2.0.0
  device_info_plus: ^8.0.0
  firebase_messaging: ^14.0.0
  flutter_secure_storage: ^9.0.0
  local_auth: ^2.0.0
  camera: ^0.10.0
  http: ^0.13.0
  path_provider: ^2.0.0

## 2. Android Setup (android/app/build.gradle)
Add to android/app/src/main/AndroidManifest.xml:
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.USE_BIOMETRIC" />

## 3. iOS Setup (ios/Runner/Info.plist)
<key>NSCameraUsageDescription</key>
<string>This app needs camera access for KYC verification</string>
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID for secure authentication</string>

## 4. Firebase Setup
flutter pub add firebase_core
flutter pub get
flutterfire configure

## 5. Initialize La Tanda API
// Create a Dart wrapper for the JavaScript API
// See example below for implementation details
`;
    }
    
    getCordovaSetup() {
        return `
# Cordova Setup for La Tanda

## 1. Install Plugins
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-file
cordova plugin add cordova-plugin-firebase-messaging
cordova plugin add cordova-plugin-touch-id

## 2. Configure config.xml
<preference name="permissions" value="none"/>
<feature name="Camera">
    <param name="ios-package" value="CDVCamera" />
</feature>

## 3. Add Permissions
<platform name="android">
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
</platform>

## 4. Include La Tanda API
<script src="js/mobile-api-integration.js"></script>
<script>
document.addEventListener('deviceready', function() {
    window.laTandaAPI = new LaTandaMobileAPI({
        baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
        debug: ${this.getEnvironmentConfig().debug}
    });
});
</script>
`;
    }
    
    getCapacitorSetup() {
        return `
# Capacitor Setup for La Tanda

## 1. Install Capacitor
npm install @capacitor/core @capacitor/cli

## 2. Install Plugins
npm install @capacitor/device @capacitor/network @capacitor/status-bar @capacitor/splash-screen @capacitor/camera @capacitor/filesystem @capacitor/push-notifications @capacitor/biometric-auth

## 3. Initialize Capacitor
npx cap init

## 4. Add Platforms
npx cap add ios
npx cap add android

## 5. Configure capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.latanda.mobile',
  appName: 'La Tanda',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera']
    },
    BiometricAuth: {
      allowDeviceCredential: true
    }
  }
};

## 6. Include La Tanda API
import { LaTandaMobileAPI } from './mobile-api-integration';

const laTandaAPI = new LaTandaMobileAPI({
    baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
    debug: ${this.getEnvironmentConfig().debug}
});
`;
    }
    
    // Platform-specific code examples
    getReactNativeExample() {
        return `
// React Native Example
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { LaTandaMobileAPI } from './mobile-api-integration';

const LaTandaApp = () => {
    const [api, setApi] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    useEffect(() => {
        const initializeAPI = async () => {
            const laTandaAPI = new LaTandaMobileAPI({
                baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
                debug: ${this.getEnvironmentConfig().debug}
            });
            
            // Set up event listeners
            laTandaAPI.on('auth:login_success', (data) => {
                setIsLoggedIn(true);
                Alert.alert('Success', 'Logged in successfully!');
            });
            
            laTandaAPI.on('auth:login_failed', (error) => {
                Alert.alert('Error', error.message || 'Login failed');
            });
            
            setApi(laTandaAPI);
        };
        
        initializeAPI();
    }, []);
    
    const handleLogin = async () => {
        if (api) {
            try {
                await api.login('user@example.com', 'password');
            } catch (error) {
                console.error('Login error:', error);
            }
        }
    };
    
    const handleGetDashboard = async () => {
        if (api && isLoggedIn) {
            try {
                const dashboard = await api.getDashboard();
                console.log('Dashboard data:', dashboard);
            } catch (error) {
                console.error('Dashboard error:', error);
            }
        }
    };
    
    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 20 }}>
                La Tanda Mobile
            </Text>
            
            {!isLoggedIn ? (
                <Button title="Login" onPress={handleLogin} />
            ) : (
                <>
                    <Button title="Get Dashboard" onPress={handleGetDashboard} />
                    <Button title="Logout" onPress={() => api.logout()} />
                </>
            )}
        </View>
    );
};

export default LaTandaApp;
`;
    }
    
    getFlutterExample() {
        return `
// Flutter Example (main.dart)
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

void main() {
    runApp(LaTandaApp());
}

class LaTandaApp extends StatelessWidget {
    @override
    Widget build(BuildContext context) {
        return MaterialApp(
            title: 'La Tanda Mobile',
            theme: ThemeData(primarySwatch: Colors.teal),
            home: LaTandaHomePage(),
        );
    }
}

class LaTandaHomePage extends StatefulWidget {
    @override
    _LaTandaHomePageState createState() => _LaTandaHomePageState();
}

class _LaTandaHomePageState extends State<LaTandaHomePage> {
    late WebViewController _controller;
    
    @override
    Widget build(BuildContext context) {
        return Scaffold(
            appBar: AppBar(title: Text('La Tanda')),
            body: WebView(
                initialUrl: 'data:text/html;base64,\${base64Encode(const Utf8Encoder().convert(_getHTML()))}',
                javascriptMode: JavascriptMode.unrestricted,
                onWebViewCreated: (WebViewController webViewController) {
                    _controller = webViewController;
                },
                javascriptChannels: <JavascriptChannel>{
                    _createLaTandaChannel(context),
                },
            ),
        );
    }
    
    JavascriptChannel _createLaTandaChannel(BuildContext context) {
        return JavascriptChannel(
            name: 'LaTandaFlutter',
            onMessageReceived: (JavascriptMessage message) {
                // Handle messages from JavaScript
                print('Message from JS: \${message.message}');
            },
        );
    }
    
    String _getHTML() {
        return '''
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>La Tanda Mobile</title>
        </head>
        <body>
            <div id="app">
                <h1>La Tanda Mobile</h1>
                <button onclick="loginUser()">Login</button>
                <div id="status"></div>
            </div>
            
            <script src="https://your-domain.com/mobile-api-integration.js"></script>
            <script>
                const api = new LaTandaMobileAPI({
                    baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
                    debug: ${this.getEnvironmentConfig().debug}
                });
                
                async function loginUser() {
                    try {
                        await api.login('user@example.com', 'password');
                        document.getElementById('status').innerHTML = 'Logged in successfully!';
                    } catch (error) {
                        document.getElementById('status').innerHTML = 'Login failed: ' + error.message;
                    }
                }
            </script>
        </body>
        </html>
        ''';
    }
}
`;
    }
    
    getCordovaExample() {
        return `
// Cordova Example (www/js/app.js)
document.addEventListener('deviceready', onDeviceReady, false);

let laTandaAPI;

function onDeviceReady() {
    console.log('Device ready, initializing La Tanda API...');
    
    laTandaAPI = new LaTandaMobileAPI({
        baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
        debug: ${this.getEnvironmentConfig().debug}
    });
    
    // Set up event listeners
    laTandaAPI.on('auth:login_success', function(data) {
        showMessage('Logged in successfully!', 'success');
        updateUI('logged-in');
    });
    
    laTandaAPI.on('auth:login_failed', function(error) {
        showMessage('Login failed: ' + error.message, 'error');
    });
    
    laTandaAPI.on('connectivity:offline', function() {
        showMessage('You are offline. Actions will be queued.', 'warning');
    });
    
    laTandaAPI.on('connectivity:online', function() {
        showMessage('Back online! Processing queued actions.', 'success');
    });
    
    updateUI('logged-out');
}

function loginUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        laTandaAPI.login(email, password).catch(function(error) {
            console.error('Login error:', error);
        });
    } else {
        showMessage('Please enter email and password', 'error');
    }
}

function logoutUser() {
    laTandaAPI.logout().then(function() {
        updateUI('logged-out');
        showMessage('Logged out successfully', 'success');
    }).catch(function(error) {
        console.error('Logout error:', error);
    });
}

function getDashboard() {
    laTandaAPI.getDashboard().then(function(dashboard) {
        console.log('Dashboard data:', dashboard);
        document.getElementById('dashboard-data').innerHTML = JSON.stringify(dashboard, null, 2);
    }).catch(function(error) {
        showMessage('Failed to get dashboard: ' + error.message, 'error');
    });
}

function updateUI(state) {
    const loginForm = document.getElementById('login-form');
    const loggedInSection = document.getElementById('logged-in-section');
    
    if (state === 'logged-in') {
        loginForm.style.display = 'none';
        loggedInSection.style.display = 'block';
    } else {
        loginForm.style.display = 'block';
        loggedInSection.style.display = 'none';
    }
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message ' + type;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(function() {
        messageDiv.style.display = 'none';
    }, 5000);
}
`;
    }
    
    getCapacitorExample() {
        return `
// Capacitor Example (src/js/app.js)
import { LaTandaMobileAPI } from './mobile-api-integration.js';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Camera, CameraResultType } from '@capacitor/camera';

class LaTandaCapacitorApp {
    constructor() {
        this.api = null;
        this.init();
    }
    
    async init() {
        // Initialize La Tanda API
        this.api = new LaTandaMobileAPI({
            baseURL: '${this.getEnvironmentConfig().apiBaseURL}',
            debug: ${this.getEnvironmentConfig().debug}
        });
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up Capacitor listeners
        this.setupCapacitorListeners();
        
        console.log('La Tanda Capacitor app initialized');
    }
    
    setupEventListeners() {
        this.api.on('auth:login_success', (data) => {
            this.showMessage('Login successful!', 'success');
            this.updateUI('authenticated');
        });
        
        this.api.on('auth:login_failed', (error) => {
            this.showMessage(\`Login failed: \${error.message}\`, 'error');
        });
        
        this.api.on('device:registered', (data) => {
            console.log('Device registered:', data);
        });
    }
    
    setupCapacitorListeners() {
        // Network status
        Network.addListener('networkStatusChange', (status) => {
            if (status.connected) {
                this.showMessage('Back online!', 'success');
            } else {
                this.showMessage('You are offline', 'warning');
            }
        });
    }
    
    async login() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            await this.api.login(email, password);
        } catch (error) {
            console.error('Login error:', error);
        }
    }
    
    async takePicture() {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.DataUrl
            });
            
            // Use the image for KYC or profile picture
            document.getElementById('captured-image').src = image.dataUrl;
            
        } catch (error) {
            this.showMessage('Camera error: ' + error.message, 'error');
        }
    }
    
    async getDeviceInfo() {
        try {
            const info = await Device.getInfo();
            console.log('Device info:', info);
            return info;
        } catch (error) {
            console.error('Device info error:', error);
        }
    }
    
    updateUI(state) {
        // Update UI based on authentication state
        const elements = document.querySelectorAll('[data-auth-state]');
        elements.forEach(el => {
            el.style.display = el.dataset.authState === state ? 'block' : 'none';
        });
    }
    
    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = \`message \${type}\`;
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.laTandaApp = new LaTandaCapacitorApp();
});
`;
    }
    
    // Generate platform-specific package.json or config files
    generatePackageJson(platform) {
        const configs = {
            'react-native': {
                name: "la-tanda-mobile",
                version: "1.0.0",
                dependencies: {
                    "react": "18.2.0",
                    "react-native": "0.72.0",
                    "@react-native-async-storage/async-storage": "^1.19.0",
                    "react-native-device-info": "^10.0.0",
                    "@react-native-firebase/messaging": "^18.0.0",
                    "react-native-keychain": "^8.0.0",
                    "react-native-biometrics": "^3.0.0",
                    "react-native-camera": "^4.2.0"
                },
                scripts: {
                    "start": "react-native start",
                    "android": "react-native run-android",
                    "ios": "react-native run-ios"
                }
            },
            
            'cordova': {
                name: "la-tanda-mobile",
                version: "1.0.0",
                dependencies: {
                    "cordova": "^12.0.0",
                    "cordova-android": "^12.0.0",
                    "cordova-ios": "^7.0.0"
                },
                cordova: {
                    platforms: ["android", "ios"],
                    plugins: {
                        "cordova-plugin-device": {},
                        "cordova-plugin-network-information": {},
                        "cordova-plugin-camera": {},
                        "cordova-plugin-firebase-messaging": {}
                    }
                }
            }
        };
        
        return configs[platform] || null;
    }
    
    // Get integration checklist
    getIntegrationChecklist(platform) {
        const baseChecklist = [
            'Install and configure La Tanda Mobile API',
            'Set up authentication flow',
            'Implement offline capability',
            'Configure push notifications',
            'Set up camera for KYC',
            'Implement biometric authentication',
            'Test API connectivity',
            'Implement error handling',
            'Set up analytics tracking',
            'Configure security features'
        ];
        
        const platformSpecific = {
            'react-native': [
                'Configure React Navigation',
                'Set up Redux/Context for state management',
                'Configure Metro bundler',
                'Set up code signing for iOS',
                'Configure Gradle for Android'
            ],
            'flutter': [
                'Configure route navigation',
                'Set up state management (Provider/Bloc)',
                'Configure build.gradle',
                'Set up iOS deployment targets',
                'Configure app signing'
            ],
            'cordova': [
                'Configure config.xml',
                'Set up platform-specific icons',
                'Configure splash screens',
                'Set up app permissions',
                'Configure build settings'
            ],
            'capacitor': [
                'Configure capacitor.config.ts',
                'Set up native project configurations',
                'Configure app icons and splash screens',
                'Set up deployment settings',
                'Configure native permissions'
            ]
        };
        
        return [...baseChecklist, ...(platformSpecific[platform] || [])];
    }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTandaMobileConfig;
} else if (typeof window !== 'undefined') {
    window.LaTandaMobileConfig = LaTandaMobileConfig;
}

console.log('📱 La Tanda Mobile App Configuration loaded!');