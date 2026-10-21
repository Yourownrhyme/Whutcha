import Foundation
import Supabase

struct AppConstants {
    // Supabase
    static let supabaseURL = URL(string: "https://kjoffilncbybquvjytxx.supabase.co")!
    static let supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqb2ZmaWxuY2J5YnF1dmp5dHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNzM1MjgsImV4cCI6MjA5Njk0OTUyOH0.C7VSZspoYz_Qqc_cZBUCxA1citn301hub1o8NFcUefU"
    
    // Глобальный клиент для всех файлов
    static let client = SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseAnonKey)
    
    // LiveKit
    static let liveKitURL = "wss://whutcha-drgxd8d7.livekit.cloud"
    
    // Web
    static let baseWebURL = "https://golden-starlight-0cdfc7.netlify.app/"
}
