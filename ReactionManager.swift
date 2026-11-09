import Foundation
import AVFoundation
import Photos
import UIKit
import SwiftUI

@MainActor
class ReactionManager: NSObject, ObservableObject, AVCaptureFileOutputRecordingDelegate {
    @Published var isRecording = false
    @Published var isExporting = false
    @Published var session = AVCaptureSession()
    @Published var savedSuccessfully = false
    @Published var errorMessage: String? = nil
    @Published var showPermissionAlert = false
    
    // 🔥 Сюда сохранится путь к итоговому склеенному файлу
    @Published var recordedFileURL: URL? = nil
    
    private let output = AVCaptureMovieFileOutput()
    
    // URL видео зрителя, которое сейчас проигрывается
    var viewerVideoURL: URL?
    
    func checkPermissionsAndSetup() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            setupCamera()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                if granted { DispatchQueue.main.async { self.setupCamera() } }
                else { DispatchQueue.main.async { self.showPermissionAlert = true } }
            }
        default:
            DispatchQueue.main.async { self.showPermissionAlert = true }
        }
    }
    
    private func setupCamera() {
        DispatchQueue.global(qos: .userInitiated).async {
            self.session.beginConfiguration()
            
            if let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
               let videoInput = try? AVCaptureDeviceInput(device: videoDevice),
               self.session.canAddInput(videoInput) {
                self.session.addInput(videoInput)
            }
            
            if let audioDevice = AVCaptureDevice.default(for: .audio),
               let audioInput = try? AVCaptureDeviceInput(device: audioDevice),
               self.session.canAddInput(audioInput) {
                self.session.addInput(audioInput)
            }
            
            if self.session.canAddOutput(self.output) {
                self.session.addOutput(self.output)
            }
            
            self.session.commitConfiguration()
            self.session.startRunning()
        }
    }
    
    func startRecording(viewerURL: URL?) {
        self.viewerVideoURL = viewerURL
        let tempPath = NSTemporaryDirectory() + "camera_\(UUID().uuidString).mp4"
        let url = URL(fileURLWithPath: tempPath)
        output.startRecording(to: url, recordingDelegate: self)
        self.isRecording = true
    }
    
    func stopRecording() {
        output.stopRecording()
        self.isRecording = false
    }
    
    // Вызывается, когда фронталка закончила запись
    nonisolated func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        
        Task { @MainActor in
            if let error = error {
                self.errorMessage = error.localizedDescription
                return
            }
            
            // Если у нас есть видео зрителя, склеиваем их!
            if let viewerURL = self.viewerVideoURL {
                await self.composeVideos(cameraURL: outputFileURL, viewerURL: viewerURL)
            } else {
                // Если почему-то видео зрителя нет, просто отдаем запись с фронталки
                self.recordedFileURL = outputFileURL
            }
        }
    }
    
    // MARK: - МАГИЯ СКЛЕЙКИ ВИДЕО (AVMutableComposition)
    private func composeVideos(cameraURL: URL, viewerURL: URL) async {
        self.isExporting = true
        
        let mixComposition = AVMutableComposition()
        
        // 1. Создаем треки в композиции
        guard let videoTrack = mixComposition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid),
              let audioTrack = mixComposition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) else {
            self.errorMessage = "Failed to create tracks"
            self.isExporting = false
            return
        }
        
        let cameraAsset = AVAsset(url: cameraURL)
        let viewerAsset = AVAsset(url: viewerURL)
        
        do {
            // Загружаем свойства асинхронно
            guard let cameraVideoTrack = try await cameraAsset.loadTracks(withMediaType: .video).first else {
                self.errorMessage = "Failed to load camera video track."
                self.isExporting = false
                return
            }
            let cameraAudioTrack = try await cameraAsset.loadTracks(withMediaType: .audio).first
            
            guard let viewerVideoTrack = try await viewerAsset.loadTracks(withMediaType: .video).first else {
                self.errorMessage = "Failed to load viewer video track."
                self.isExporting = false
                return
            }
            let viewerAudioTrack = try await viewerAsset.loadTracks(withMediaType: .audio).first
            
            let duration = try await cameraAsset.load(.duration)
            let timeRange = CMTimeRangeMake(start: .zero, duration: duration)
            
            // 2. Вставляем видео стримера (фронталка) на всю длину
            try videoTrack.insertTimeRange(timeRange, of: cameraVideoTrack, at: .zero)
            if let cAudio = cameraAudioTrack {
                try audioTrack.insertTimeRange(timeRange, of: cAudio, at: .zero)
            }
            
            // Вставляем аудио зрителя (чтобы было слышно донат) поверх голоса стримера
            if let vAudio = viewerAudioTrack {
                let viewerAudioMixTrack = mixComposition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid)
                let viewerDuration = try await viewerAsset.load(.duration)
                let playDuration = min(duration.seconds, viewerDuration.seconds) // Берем наименьшую длину
                let vTimeRange = CMTimeRangeMake(start: .zero, duration: CMTime(seconds: playDuration, preferredTimescale: 600))
                try viewerAudioMixTrack?.insertTimeRange(vTimeRange, of: vAudio, at: .zero)
            }
            
            // 3. Настраиваем визуал (PiP - Картинка в картинке)
            let renderSize = CGSize(width: 1080, height: 1920) // TikTok формат (9:16)
            
            let mainInstruction = AVMutableVideoCompositionInstruction()
            mainInstruction.timeRange = timeRange
            
            // Настройка слоя Стримера (Фон)
            let cameraLayerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: videoTrack)
            // Центрируем и обрезаем видео с фронталки под 9:16
            let cameraTransform = try await cameraVideoTrack.load(.preferredTransform)
            cameraLayerInstruction.setTransform(cameraTransform, at: .zero)
            
            // Настройка слоя Зрителя (PiP)
            // Для PiP мы не можем просто использовать один videoTrack, нам нужен отдельный видео трек в композиции
            guard let pipVideoTrack = mixComposition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { return }
            let viewerDuration = try await viewerAsset.load(.duration)
            let playDuration = min(duration.seconds, viewerDuration.seconds)
            let vTimeRange = CMTimeRangeMake(start: .zero, duration: CMTime(seconds: playDuration, preferredTimescale: 600))
            try pipVideoTrack.insertTimeRange(vTimeRange, of: viewerVideoTrack, at: .zero)
            
            let pipLayerInstruction = AVMutableVideoCompositionLayerInstruction(assetTrack: pipVideoTrack)
            
            // Вычисляем масштаб и позицию для PiP (например, правый верхний угол)
            let pipWidth: CGFloat = 360 // Ширина окошка
            let pipHeight: CGFloat = 640 // Высота окошка
            let margin: CGFloat = 40
            
            let pipTransform = try await viewerVideoTrack.load(.preferredTransform)
            
            // Сдвигаем в правый верхний угол
            let moveTransform = CGAffineTransform(translationX: renderSize.width - pipWidth - margin, y: renderSize.height - pipHeight - margin - 200) // -200 чтобы не закрывать лицо
            // Сжимаем
            let scaleTransform = CGAffineTransform(scaleX: pipWidth / renderSize.width, y: pipHeight / renderSize.height)
            
            let finalPipTransform = pipTransform.concatenating(scaleTransform).concatenating(moveTransform)
            pipLayerInstruction.setTransform(finalPipTransform, at: .zero)
            
            // Собираем инструкции (Порядок важен! PiP должен быть ПЕРВЫМ в массиве, чтобы быть ПОВЕРХ фона)
            mainInstruction.layerInstructions = [pipLayerInstruction, cameraLayerInstruction]
            
            let videoComposition = AVMutableVideoComposition()
            videoComposition.instructions = [mainInstruction]
            videoComposition.frameDuration = CMTimeMake(value: 1, timescale: 30) // 30 FPS
            videoComposition.renderSize = renderSize
            
            // 4. Экспорт итогового видео
            let outputPath = NSTemporaryDirectory() + "reaction_final_\(UUID().uuidString).mp4"
            let outputURL = URL(fileURLWithPath: outputPath)
            
            guard let exporter = AVAssetExportSession(asset: mixComposition, presetName: AVAssetExportPresetHighestQuality) else { return }
            exporter.outputURL = outputURL
            exporter.outputFileType = .mp4
            exporter.shouldOptimizeForNetworkUse = true
            exporter.videoComposition = videoComposition
            
            await exporter.export()
            
            if exporter.status == .completed {
                print("✅ Видео успешно склеено!")
                self.recordedFileURL = outputURL
                self.saveToGallery(url: outputURL) // Бекап в галерею
            } else {
                print("❌ Ошибка склейки: \(String(describing: exporter.error))")
                self.errorMessage = exporter.error?.localizedDescription
            }
            
        } catch {
            self.errorMessage = error.localizedDescription
        }
        
        self.isExporting = false
    }
    
    private func saveToGallery(url: URL) {
        PHPhotoLibrary.requestAuthorization { status in
            if status == .authorized {
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: url)
                }) { [weak self] success, error in
                    DispatchQueue.main.async {
                        if success {
                            self?.savedSuccessfully = true
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Утилиты

// Утилита для вывода сырой картинки с камеры на экран
struct CameraPreviewView: UIViewRepresentable {
    let session: AVCaptureSession
    
    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: UIScreen.main.bounds)
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.frame
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        return view
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        if let layer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
            layer.session = session
            layer.frame = uiView.bounds
        }
    }
}

// 🔥 Утилита для вызова стандартного меню "Поделиться"
struct ShareSheet: UIViewControllerRepresentable {
    var activityItems: [Any]
    var onDismiss: () -> Void

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
        controller.completionWithItemsHandler = { _, _, _, _ in
            onDismiss() // Вызываем при закрытии окна
        }
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
