import SwiftUI
import Supabase

// Вшиваем клиент напрямую, чтобы не зависеть от AppConstants
private let supabaseUrl = URL(string: "https://kjoffilncbybquvjytxx.supabase.co")!
private let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU"
private let supabase = SupabaseClient(supabaseURL: supabaseUrl, supabaseKey: supabaseKey)

// Строгие модели вместо AnyJSON
struct ProfileData: Decodable {
    let external_pay_link: String?
}

struct ProfileUpdate: Encodable {
    let external_pay_link: String
}

struct WalletView: View {
    @AppStorage("streamerID") private var streamerID = ""
    @State private var payLink: String = ""
    @State private var isSaving = false
    @State private var showSuccess = false
    @Environment(\.dismiss) var dismiss
    
    let appBackground = Color(red: 0.04, green: 0.04, blue: 0.06)
    let panelBackground = Color(red: 0.08, green: 0.08, blue: 0.12)
    let brandGradient = LinearGradient(colors: [Color(red: 0.2, green: 0.8, blue: 0.9), Color(red: 0.6, green: 0.2, blue: 0.9)], startPoint: .topLeading, endPoint: .bottomTrailing)
    
    var body: some View {
        NavigationStack {
            ZStack {
                appBackground.edgesIgnoringSafeArea(.all)
                
                VStack(spacing: 24) {
                    VStack(spacing: 12) {
                        ZStack {
                            Circle().fill(brandGradient.opacity(0.15)).frame(width: 80, height: 80)
                            Image(systemName: "link").font(.system(size: 30, weight: .bold)).foregroundStyle(brandGradient)
                        }
                        .padding(.top, 40)
                        
                        Text("Payout Link")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundColor(.white)
                        
                        Text("Paste your DonationAlerts, PayPal.me, or Ko-fi link here. Viewers will be redirected to pay you directly. 100% of the money goes to you.")
                            .font(.system(size: 14))
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 20)
                    }
                    
                    VStack(alignment: .leading, spacing: 8) {
                        Text("YOUR PAYMENT LINK")
                            .font(.system(size: 12, weight: .bold, design: .monospaced))
                            .foregroundColor(.gray)
                            .padding(.horizontal, 20)
                        
                        TextField("https://donationalerts.com/r/yourname", text: $payLink)
                            .padding(16)
                            .background(panelBackground)
                            .cornerRadius(12)
                            .foregroundColor(.white)
                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
                            .padding(.horizontal, 20)
                            .autocapitalization(.none)
                            .keyboardType(.URL)
                    }
                    
                    Spacer()
                    
                    Button(action: saveLink) {
                        HStack {
                            if isSaving {
                                ProgressView().tint(.white)
                            } else {
                                Text(showSuccess ? "Saved!" : "Save Link")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                Image(systemName: showSuccess ? "checkmark.circle.fill" : "arrow.right")
                            }
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(showSuccess ? Color.green : Color(red: 0.6, green: 0.2, blue: 0.9))
                        .cornerRadius(14)
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)
                    .disabled(isSaving || payLink.isEmpty)
                }
            }
            .navigationTitle("Setup Payments")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }.foregroundColor(.cyan)
                }
            }
            .task { await fetchLink() }
        }
        .preferredColorScheme(.dark)
    }
    
    private func fetchLink() async {
        do {
            let data: ProfileData = try await supabase.database
                .from("profiles")
                .select("external_pay_link")
                .eq("id", value: streamerID)
                .single()
                .execute()
                .value
            
            if let link = data.external_pay_link {
                DispatchQueue.main.async {
                    self.payLink = link
                }
            }
        } catch { print("Fetch error: \(error)") }
    }
    
    private func saveLink() {
        Task {
            DispatchQueue.main.async { isSaving = true }
            do {
                let updateData = ProfileUpdate(external_pay_link: payLink)
                try await supabase.database
                    .from("profiles")
                    .update(updateData)
                    .eq("id", value: streamerID)
                    .execute()
                
                DispatchQueue.main.async {
                    withAnimation { showSuccess = true }
                    let generator = UINotificationFeedbackGenerator()
                    generator.notificationOccurred(.success)
                }
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    showSuccess = false
                }
            } catch { print("Save error: \(error)") }
            DispatchQueue.main.async { isSaving = false }
        }
    }
}
