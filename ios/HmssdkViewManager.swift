import HMSSDK
import AVKit

@objc(HmssdkViewManager)
class HmssdkViewManager: RCTViewManager {

    override func view() -> (HmssdkView) {
        return HmssdkView()
    }
}

class HmssdkView : UIView {
    var hms: HMSSDK?
    var room: HMSRoom?
    var config: HMSConfig?
    var videoTracks = [HMSVideoTrack]()
    var initialized = false
    
    @objc var switchCamera:Bool = false {
        didSet {
            hms?.localPeer?.localVideoTrack()?.switchCamera()
        }
    }
    
    @objc var muteVideo: Bool = false {
        didSet {
            hms?.localPeer?.localVideoTrack()?.setMute(muteVideo)
        }
    }
    
    @objc var color: String = "" {
        didSet {
            self.backgroundColor = hexStringToUIColor(hexColor: color)
        }
    }

    @objc var authToken: String? {
        didSet {
            initializeSDK()
        }
    }

    let reuseIdentifier = "cell"
    var collectionView = UICollectionView(frame: CGRect(x: 0, y: 0, width: 350.0, height: 700.0), collectionViewLayout: UICollectionViewFlowLayout() )

    @objc var roomId: String? {
        didSet {
            initializeSDK()
        }
    }

    @objc var userId: String? {
        didSet {
            initializeSDK()
        }
    }

    @objc var isMute: Bool = false {
        didSet {
            // set current user Mute
            hms?.localPeer?.localAudioTrack()?.setMute(isMute)
        }
    }
    
    @objc var layout: NSDictionary? {
        didSet {
            // nothing to do here but this room Id is required
            let width: CGFloat = layout?.value(forKey: "width") as! CGFloat
            let height: CGFloat = layout?.value(forKey: "height") as! CGFloat
            collectionView.frame = CGRect(x: 0,y: 0, width: width, height: height)
        }
    }
    
    override init(frame: CGRect) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            // Permission Acquired if value of 'granted' is true
            print(#function, "permission granted: ", granted)
        }
                
        AVCaptureDevice.requestAccess(for: .audio) { granted in
            // Permission Acquired if value of 'granted' is true
            print(#function, "permission granted: ", granted)
        }
        
        super.init(frame: frame)
        hms = HMSSDK.build()
        
        // Adding collection view to Component.
        collectionView.backgroundColor=#colorLiteral(red: 0.1019607857, green: 0.2784313858, blue: 0.400000006, alpha: 1)
        self.addSubview(collectionView)
        self.frame = frame
        collectionView.delegate = self
        collectionView.dataSource = self
        collectionView.register(VideoCollectionViewCell.self, forCellWithReuseIdentifier: "videoCell")
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func hexStringToUIColor(hexColor: String) -> UIColor {
        let stringScanner = Scanner(string: hexColor)

        if(hexColor.hasPrefix("#")) {
            stringScanner.scanLocation = 1
        }
        var color: UInt32 = 0
        stringScanner.scanHexInt32(&color)

        let r = CGFloat(Int(color >> 16) & 0x000000FF)
        let g = CGFloat(Int(color >> 8) & 0x000000FF)
        let b = CGFloat(Int(color) & 0x000000FF)

        return UIColor(red: r / 255.0, green: g / 255.0, blue: b / 255.0, alpha: 0.2)
    }
    
    func initializeSDK() {
        // join the room if all required values are available
        if let jwtToken = authToken, let user = userId, let room = roomId {
            // join only if not already initialized
            if !initialized {
                initialized = true
                config = HMSConfig(userID: user, roomID: room, authToken: jwtToken)
                hms?.join(config: config!, delegate: self)
            }
        }
    }
}

extension HmssdkView: HMSUpdateListener {
    func on(join room: HMSRoom) {
        // Callback from join action
    }
    
    func on(room: HMSRoom, update: HMSRoomUpdate) {
        // Listener for any updation in room
        updateViews()
    }
    
    func on(peer: HMSPeer, update: HMSPeerUpdate) {
        // Listener for updates in Peers
        updateViews()
    }
    
    func on(track: HMSTrack, update: HMSTrackUpdate, for peer: HMSPeer) {
        // Listener for updates in Tracks
        updateViews()
    }
    
    // Update function that sync up current room configurations
    func updateViews() {
        var newVideoTracks = [HMSVideoTrack]()
        if let localVideo = hms?.localPeer?.videoTrack {
            newVideoTracks.append(localVideo)
        }
        let newRemoteVideoTracks = hms?.remotePeers ?? []
        for item in newRemoteVideoTracks {
            if let remoteVideo = item.videoTrack {
                newVideoTracks.append(remoteVideo)
            }
        }
        videoTracks = newVideoTracks
        print(videoTracks, "videoTracks")
        DispatchQueue.main.async {
            self.collectionView.reloadData()
        }
    }
    
    func on(error: HMSError) {
        // TODO: errors to be handled here
    }
    
    func on(message: HMSMessage) {
        // TODO: HMS message handling
    }
    
    func on(updated speakers: [HMSSpeaker]) {
        // TODO: HMS speaker updates
    }
    
    func onReconnecting() {
        // TODO: Reconnection feedback to be dispatched from here
    }
    
    func onReconnected() {
        // TODO: Reconnected feedack to be dispatched from here
    }
}

extension HmssdkView: UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
    // Returns count of video tracks to be displayed on collectionVIew
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return videoTracks.count
    }
    
    // returns a collectionViewCell for a single track, called for each cell once
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "videoCell", for: indexPath) as? VideoCollectionViewCell, indexPath.item < videoTracks.count else {
            return UICollectionViewCell()
        }
        let track = videoTracks[indexPath.item]
        cell.videoView.setVideoTrack(track)
        
        return cell
    }
    
    // returns collectionViewCell size for each cell
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        var result = CGSize.zero
        
        result.width = floor(collectionView.frame.size.width / 2.0 - 15.0)
        result.height = floor(collectionView.frame.size.height / 2.0)

        return result
    }
}
