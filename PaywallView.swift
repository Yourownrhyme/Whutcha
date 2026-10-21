import SwiftUI
import StoreKit

struct PaywallView: View {
    @EnvironmentObject var subManager: SubscriptionManager
    @EnvironmentObject var authManager: AuthManager
    
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let brandGradient = LinearGradient(colors: [Color(red: 0.6, green: 0.2, blue: 0.9), Color(red: 0.2, green: 0.8, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    var body: some View {
        ZStack {
            appBackground.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 24) {
                Spacer()
                
                // Логотип
                Text("W")
                    .font(.system(size: 80, weight: .heavy, design: .rounded))
                    .foregroundStyle(brandGradient)
                    .shadow(color: Color(red: 0.6, green: 0.2, blue: 0.9).opacity(0.4), radius: 20)
                
                Text("Whutcha Pro")
                    .font(.system(size: 32, weight: .black, design: .rounded))
                    .foregroundColor(.white)
                
                // Киллер-фичи для стримера
                VStack(alignment: .leading, spacing: 16) {
                    featureRow(icon: "bolt.fill", text: "Unlimited Video & Co-Stream Requests")
                    featureRow(icon: "dollarsign.circle.fill", text: "Keep 100% of your donations (No Fees)")
                    featureRow(icon: "shield.fill", text: "Advanced Anti-Toxic Shield & Bans")
                    featureRow(icon: "sparkles.tv", text: "Auto-export reactions to TikTok")
                }
                .padding(.vertical, 20)
                
                Spacer()
                
                // Кнопка покупки
                if let product = subManager.proProduct {
                    Button(action: {
                        Task { await subManager.purchase() }
                    }) {
                        HStack {
                            if subManager.isLoading {
                                ProgressView().tint(.white)
                            } else {
                                // 🔥 Обновленный текст с триалом
                                VStack(spacing: 2) {
                                    Text("Start 7-Day Free Trial")
                                        .font(.system(size: 18, weight: .bold, design: .rounded))
                                    Text("Then \(product.displayPrice)/mo")
                                        .font(.system(size: 12, weight: .medium))
                                        .foregroundColor(.white.opacity(0.8))
                                }
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14) // Чуть уменьшил паддинг из-за VStack
                        .background(brandGradient)
                        .cornerRadius(16)
                        .shadow(color: Color.cyan.opacity(0.4), radius: 15, y: 5)
                    }
                    .disabled(subManager.isLoading)
                    
                    Text("Auto-renews monthly. Cancel anytime.")
                        .font(.caption)
                        .foregroundColor(.gray)
                } else {
                    ProgressView().tint(.cyan)
                        .frame(height: 60)
                    Text("Loading store...")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                // Кнопки управления аккаунтом
                HStack(spacing: 30) {
                    Button("Restore Purchases") {
                        Task { await subManager.restorePurchases() }
                    }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.gray)
                    
                    Button("Sign Out") {
                        authManager.signOut()
                    }
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.red.opacity(0.8))
                }
                .padding(.bottom, 10)
                
                // 🔥 ССЫЛКИ GDPR (Privacy Policy & Terms)
                HStack(spacing: 16) {
                    Link("Privacy Policy", destination: URL(string: "https://roily.link/privacy")!)
                    Text("•").foregroundColor(.gray)
                    Link("Terms of Service", destination: URL(string: "https://roily.link/terms")!)
                }
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.gray)
                .padding(.bottom, 20)
            }
            .padding(.horizontal, 30)
        }
        .preferredColorScheme(.dark)
    }
    
    // Вспомогательная функция для пунктов
    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(.cyan)
                .frame(width: 30)
            
            Text(text)
                .font(.system(size: 15, weight: .semibold))
                .foregroundColor(.white)
        }
    }
}
