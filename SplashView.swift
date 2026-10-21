import SwiftUI
import Supabase

struct SplashView: View {
    @StateObject private var authManager = AuthManager()
    @StateObject private var subManager = SubscriptionManager() // 🔥 Добавили менеджер подписок
    
    @State private var isChecking = true
    @State private var email = ""
    @State private var password = ""
    @State private var isSignUp = false
    
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let panelBackground = Color(red: 0.08, green: 0.08, blue: 0.12)
    let brandGradient = LinearGradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.9), Color(red: 0.2, green: 0.8, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    var body: some View {
        Group {
            if isChecking {
                // ЭКРАН ЗАГРУЗКИ (Splash)
                ZStack {
                    appBackground.edgesIgnoringSafeArea(.all)
                    VStack(spacing: 24) {
                        Text("W")
                            .font(.system(size: 100, weight: .heavy, design: .rounded))
                            .foregroundStyle(brandGradient)
                            .shadow(color: Color(red: 0.6, green: 0.2, blue: 0.9).opacity(0.4), radius: 20, x: 0, y: 10)
                        
                        ProgressView().tint(.white)
                    }
                }
            } else if authManager.isAuthenticated {
                // 🔥 ВАЖНАЯ ЛОГИКА: ПРОВЕРКА ПОДПИСКИ
                if subManager.isSubscribed {
                    ContentView()
                        .environmentObject(authManager)
                        .environmentObject(subManager) // Передаем вниз на всякий случай
                } else {
                    PaywallView()
                        .environmentObject(authManager)
                        .environmentObject(subManager)
                }
            } else {
                // ЭКРАН АВТОРИЗАЦИИ
                ZStack {
                    appBackground.edgesIgnoringSafeArea(.all)
                    
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 24) {
                            Text("W")
                                .font(.system(size: 80, weight: .heavy, design: .rounded))
                                .foregroundStyle(brandGradient)
                                .shadow(color: Color(red: 0.6, green: 0.2, blue: 0.9).opacity(0.3), radius: 15)
                                .padding(.top, 40)
                            
                            Text("Whutcha")
                                .font(.system(size: 32, weight: .black, design: .rounded))
                                .foregroundColor(.white)
                                .tracking(2)
                                .padding(.bottom, 10)
                            
                            // 🔥 СЕТКА OAUTH КНОПОК
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                                
                                // Apple (Сделаем черной, пока не настроишь - будет просто крутиться/ошибаться)
                                authButton(title: "Apple", icon: "applelogo", color: .white, bgColor: .black, provider: .apple)
                                
                                // Google
                                authButton(title: "Google", icon: "g.circle.fill", color: .white, bgColor: .red, provider: .google)
                                
                                // Twitch
                                authButton(title: "Twitch", icon: "tv.fill", color: .white, bgColor: Color(red: 0.57, green: 0.27, blue: 1.0), provider: .twitch)
                                
                                // Discord
                                authButton(title: "Discord", icon: "bubble.left.and.bubble.right.fill", color: .white, bgColor: Color(red: 0.34, green: 0.4, blue: 0.95), provider: .discord)
                                
                                // Facebook
                                authButton(title: "Facebook", icon: "f.circle.fill", color: .white, bgColor: .blue, provider: .facebook)
                                
                                // X (Twitter)
                                authButton(title: "X", icon: "xmark.circle.fill", color: .black, bgColor: .white, provider: .twitter)
                            }
                            .padding(.horizontal, 30)
                            
                            
                            
                            // Разделитель
                            HStack {
                                VStack { Divider().background(Color.gray.opacity(0.5)) }
                                Text("OR EMAIL").foregroundColor(.gray).font(.caption).bold()
                                VStack { Divider().background(Color.gray.opacity(0.5)) }
                            }
                            .padding(.horizontal, 40)
                            .padding(.vertical, 8)
                            
                            // Скрываемый блок с Email (для резерва)
                            VStack(spacing: 16) {
                                TextField("Email", text: $email)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .padding()
                                    .background(panelBackground)
                                    .cornerRadius(14)
                                    .foregroundColor(.white)
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 1))
                                
                                SecureField("Password", text: $password)
                                    .padding()
                                    .background(panelBackground)
                                    .cornerRadius(14)
                                    .foregroundColor(.white)
                                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            }
                            .padding(.horizontal, 30)
                            
                            if !authManager.errorMessage.isEmpty {
                                Text(authManager.errorMessage)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal, 30)
                            }
                            
                            if authManager.isLoading {
                                ProgressView().tint(.cyan)
                                    .padding(.top, 10)
                            } else {
                                Button(action: {
                                    Task {
                                        if isSignUp {
                                            await authManager.signUp(email: email, password: password)
                                        } else {
                                            await authManager.signIn(email: email, password: password)
                                        }
                                    }
                                }) {
                                    Text(isSignUp ? "Create Email Account" : "Sign In with Email")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundColor(.white)
                                        .frame(maxWidth: .infinity)
                                        .padding()
                                        .background(brandGradient)
                                        .cornerRadius(14)
                                }
                                .padding(.horizontal, 30)
                            }
                            
                            Button(action: {
                                withAnimation { isSignUp.toggle() }
                                authManager.errorMessage = ""
                            }) {
                                Text(isSignUp ? "Already have an account? Sign in" : "Don't have an email account? Sign up")
                                    .foregroundColor(.gray)
                                    .font(.footnote)
                            }
                            
                            // 🔥 ССЫЛКИ GDPR (Privacy Policy & Terms)
                            HStack(spacing: 16) {
                                Link("Privacy Policy", destination: URL(string: "https://roily.link/privacy")!)
                                Text("•").foregroundColor(.gray)
                                Link("Terms of Service", destination: URL(string: "https://roily.link/terms")!)
                            }
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(.gray)
                            .padding(.top, 10)
                            .padding(.bottom, 40)
                        }
                    }
                }
            }
        }
        .task {
            await authManager.checkSession()
            withAnimation { isChecking = false }
        }
    }
}

// Вспомогательный UI-компонент для кнопок соцсетей
extension SplashView {
    private func authButton(title: String, icon: String, color: Color, bgColor: Color, provider: CustomOAuthProvider) -> some View {
        Button(action: {
            Task { await authManager.signInWithOAuth(provider: provider) }
        }) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 16))
                Text(title)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
            }
            .foregroundColor(color)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(bgColor)
            .cornerRadius(12)
            .shadow(color: bgColor.opacity(0.3), radius: 5, y: 3)
        }
    }
}
