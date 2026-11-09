import Foundation
import SwiftUI
import AuthenticationServices
import Supabase

// Убрали Zoom, оставили только поддерживаемые провайдеры
enum CustomOAuthProvider: String {
    case apple = "apple"
    case google = "google"
    case twitch = "twitch"
    case discord = "discord"
    case facebook = "facebook"
    case twitter = "twitter"
    
    var supabaseProvider: Provider {
        switch self {
        case .apple: return .apple
        case .google: return .google
        case .twitch: return .twitch
        case .discord: return .discord
        case .facebook: return .facebook
        case .twitter: return .twitter
        }
    }
}

@MainActor
class AuthManager: NSObject, ObservableObject, ASWebAuthenticationPresentationContextProviding {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var errorMessage = ""
    
    func checkSession() async {
        if UserDefaults.standard.string(forKey: "access_token") != nil {
            self.isAuthenticated = true
        } else {
            self.isAuthenticated = false
        }
    }
    
    // MARK: - УНИВЕРСАЛЬНЫЙ OAUTH ЛОГИН
    func signInWithOAuth(provider: CustomOAuthProvider) async {
        isLoading = true
        errorMessage = ""
        
        do {
            let redirectURL = URL(string: "whutcha://login-callback")!
            
            let authURL = try await AppConstants.client.auth.getOAuthSignInURL(
                provider: provider.supabaseProvider,
                redirectTo: redirectURL
            )
            
            let session = ASWebAuthenticationSession(url: authURL, callbackURLScheme: "whutcha") { [weak self] callbackURL, error in
                guard let self = self else { return }
                
                if let error = error {
                    DispatchQueue.main.async {
                        self.errorMessage = error.localizedDescription
                        self.isLoading = false
                    }
                    return
                }
                
                guard let callbackURL = callbackURL else { return }
                
                Task {
                    do {
                        let session = try await AppConstants.client.auth.session(from: callbackURL)
                        
                        UserDefaults.standard.set(session.accessToken, forKey: "access_token")
                        UserDefaults.standard.set(session.user.id.uuidString, forKey: "streamerID")
                        
                        DispatchQueue.main.async {
                            self.isAuthenticated = true
                            self.isLoading = false
                        }
                    } catch {
                        DispatchQueue.main.async {
                            self.errorMessage = error.localizedDescription
                            self.isLoading = false
                        }
                    }
                }
            }
            
            session.presentationContextProvider = self
            session.start()
            
        } catch {
            self.errorMessage = error.localizedDescription
            self.isLoading = false
        }
    }
    
    // 🔥 ФИКС: Безопасное получение окна для ASWebAuthenticationSession
    // Убрали MainActor.assumeIsolated, чтобы избежать краша, если вызов придет вне главного потока
    // MARK: - ASWebAuthenticationPresentationContextProviding
        func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
            let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene
            let window = windowScene?.windows.first { $0.isKeyWindow }
            return window ?? ASPresentationAnchor()
        }
    
    // MARK: - EMAIL AUTH (Резерв)
    func signUp(email: String, password: String) async {
        await authenticate(endpoint: "signup", email: email, password: password)
    }
    
    func signIn(email: String, password: String) async {
        await authenticate(endpoint: "token?grant_type=password", email: email, password: password)
    }
    
    private func authenticate(endpoint: String, email: String, password: String) async {
        isLoading = true
        errorMessage = ""
        
        guard let url = URL(string: "\(AppConstants.supabaseURL)/auth/v1/\(endpoint)") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(AppConstants.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = ["email": email, "password": password]
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    if let token = json["access_token"] as? String {
                        UserDefaults.standard.set(token, forKey: "access_token")
                    }
                    if let user = json["user"] as? [String: Any], let uid = user["id"] as? String {
                        UserDefaults.standard.set(uid, forKey: "streamerID")
                    } else if let uid = json["id"] as? String {
                        UserDefaults.standard.set(uid, forKey: "streamerID")
                    }
                    self.isAuthenticated = true
                }
            } else {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let msg = json["error_description"] as? String ?? json["msg"] as? String {
                    self.errorMessage = msg
                } else {
                    self.errorMessage = "Authentication failed."
                }
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signOut() {
        UserDefaults.standard.removeObject(forKey: "access_token")
        UserDefaults.standard.removeObject(forKey: "streamerID")
        self.isAuthenticated = false
    }
    
    func deleteAccount() async {
        isLoading = true
        errorMessage = ""
        
        guard let url = URL(string: "\(AppConstants.supabaseURL)/rest/v1/rpc/delete_user_account") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        guard let token = UserDefaults.standard.string(forKey: "access_token") else {
            self.errorMessage = "No active session."
            isLoading = false
            return
        }
        
        request.setValue(AppConstants.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) {
                self.signOut()
            } else {
                self.errorMessage = "Failed to delete account from server."
            }
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
}
