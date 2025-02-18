import { NativeEventEmitter, NativeModules } from 'react-native';
import { HMSUpdateListenerActions } from './HMSUpdateListenerActions';
import type { HMSConfig } from './HMSConfig';
import type { HMSLocalPeer } from './HMSLocalPeer';
import type { HMSRemotePeer } from './HMSRemotePeer';
import type { HMSRoom } from './HMSRoom';
import type { HMSRole } from './HMSRole';
import { HMSEncoder } from './HMSEncoder';
import { HMSMessage } from './HMSMessage';
import { HMSHelper } from './HMSHelper';
import type { HMSTrack } from './HMSTrack';
import type { HMSLogger } from './HMSLogger';

const {
  /**
   * @ignore
   */
  HmsManager,
} = NativeModules;

const HmsEventEmitter = new NativeEventEmitter(HmsManager);

let HmsSdk: HMSSDK | undefined;

export class HMSSDK {
  room?: HMSRoom;
  localPeer?: HMSLocalPeer;
  remotePeers?: HMSRemotePeer[];
  knownRoles?: HMSRole[];
  logger?: HMSLogger;

  onPreviewDelegate?: any;
  onJoinDelegate?: any;
  onRoomDelegate?: any;
  onPeerDelegate?: any;
  onTrackDelegate?: any;
  onErrorDelegate?: any;
  onMessageDelegate?: any;
  onSpeakerDelegate?: any;
  onReconnectingDelegate?: any;
  onReconnectedDelegate?: any;
  onRoleChangeRequestDelegate?: any;
  onRemovedFromRoomDelegate?: any;

  /**
   * - Returns an instance of [HMSSDK]{@link HMSSDK}
   * - This function must be called to get an instance of HMSSDK class and only then user can interact with its methods
   *
   * @static
   * @returns
   * @memberof HMSSDK
   */
  static build() {
    if (HmsSdk) {
      return HmsSdk;
    }
    HmsManager.build();
    HmsSdk = new HMSSDK();
    return HmsSdk;
  }

  attachPreviewListener = () => {
    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_PREVIEW,
      this.onPreviewListener
    );
  };

  attachListeners = () => {
    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_JOIN,
      this.onJoinListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_ROOM_UPDATE,
      this.onRoomListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_PEER_UPDATE,
      this.onPeerListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_TRACK_UPDATE,
      this.onTrackListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_ERROR,
      this.onErrorListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_MESSAGE,
      this.onMessageListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_SPEAKER,
      this.onSpeakerListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.RECONNECTING,
      this.reconnectingListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.RECONNECTED,
      this.reconnectedListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_ROLE_CHANGE_REQUEST,
      this.onRoleChangeRequestListener
    );

    HmsEventEmitter.addListener(
      HMSUpdateListenerActions.ON_REMOVED_FROM_ROOM,
      this.onRemovedFromRoomListener
    );
  };

  /**
   * takes an instance of [HMSConfig]{@link HMSConfig} and joins the room
   * after joining the room user will start receiving the events and updates of the room
   *
   * @param {HMSConfig} config
   * @memberof HMSSDK
   */
  join = async (config: HMSConfig) => {
    this.logger?.verbose('JOIN', { config });
    this.attachListeners();
    await HmsManager.join(config);
  };

  preview = (config: HMSConfig) => {
    this.logger?.verbose('PREVIEW', { config });
    this.attachPreviewListener();
    HmsManager.preview(config);
  };

  /**
   * Calls leave function of native sdk and session of current user is invalidated
   *
   * @memberof HMSSDK
   */
  leave = () => {
    this.logger?.verbose('LEAVE', {});
    HmsManager.leave();
  };

  sendBroadcastMessage = (message: string) => {
    this.logger?.verbose('SEND_BROADCAST_MESSAGE', { message });
    HmsManager.sendBroadcastMessage({ message });
  };

  sendGroupMessage = (message: string, roles: HMSRole[]) => {
    this.logger?.verbose('SEND_GROUP_MESSAGE', { message, roles });
    HmsManager.sendGroupMessage({
      message,
      roles: HMSHelper.getRoleNames(roles),
    });
  };

  sendDirectMessage = (message: string, peerId: string) => {
    this.logger?.verbose('SEND_DIRECT_MESSAGE', { message, peerId });
    HmsManager.sendDirectMessage({
      message,
      peerId,
    });
  };

  changeRole = (peerId: string, role: string, force: boolean = false) => {
    const data = {
      peerId: peerId,
      role: role,
      force: force,
    };
    this.logger?.verbose('CHANGE_ROLE', data);
    HmsManager.changeRole(data);
  };

  changeTrackState = (track: HMSTrack, mute: boolean) => {
    this.logger?.verbose('CHANGE_TRACK_STATE', { track, mute });
    const data = {
      trackId: track.trackId,
      mute,
    };

    HmsManager.changeTrackState(data);
  };

  removePeer = (peerId: string, reason: string) => {
    this.logger?.verbose('REMOVE_PEER', { peerId, reason });
    const data = {
      peerId,
      reason,
    };

    HmsManager.removePeer(data);
  };

  endRoom = (lock: boolean, reason: string) => {
    this.logger?.verbose('END_ROOM', { lock, reason });
    const data = {
      lock,
      reason,
    };

    HmsManager.endRoom(data);
  };

  acceptRoleChange = () => {
    this.logger?.verbose('ACCEPT_ROLE_CHANGE', {});
    HmsManager.acceptRoleChange();
  };

  muteAllPeersAudio = (mute: boolean) => {
    this.logger?.verbose('ON_MUTE_ALL_PEERS', { mute });
    HmsManager.muteAllPeersAudio(mute);
  };

  /**
   * - This is a prototype event listener that takes action and listens for updates related to that particular action
   * - This method will be @deprecated in future and event listener will be passed in join method
   *
   * @param {string} action
   * @param {*} callback
   * @memberof HMSSDK
   */
  addEventListener = (action: HMSUpdateListenerActions, callback: any) => {
    this.logger?.verbose('ON_ATTACH_EVENT_LISTENER', { action });
    switch (action) {
      case HMSUpdateListenerActions.ON_PREVIEW:
        this.onPreviewDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_JOIN:
        this.onJoinDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_ROOM_UPDATE:
        this.onRoomDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_PEER_UPDATE:
        this.onPeerDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_TRACK_UPDATE:
        this.onTrackDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_ERROR:
        this.onErrorDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_MESSAGE:
        this.onMessageDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_SPEAKER:
        this.onSpeakerDelegate = callback;
        break;
      case HMSUpdateListenerActions.RECONNECTING:
        this.onReconnectingDelegate = callback;
        break;
      case HMSUpdateListenerActions.RECONNECTED:
        this.onReconnectedDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_ROLE_CHANGE_REQUEST:
        this.onRoleChangeRequestDelegate = callback;
        break;
      case HMSUpdateListenerActions.ON_REMOVED_FROM_ROOM:
        this.onRemovedFromRoomDelegate = callback;
        break;
      default:
    }
  };

  /**
   * - This is a prototype event listener that takes action and listens for updates related to that particular action
   * - This method will be @deprecated in future and event listener will be passed in join method
   *
   * @param {string} action
   * @param {*} callback
   * @memberof HMSSDK
   */
  removeEventListener = (action: HMSUpdateListenerActions) => {
    this.logger?.verbose('ON_REMOVE_LISTENER', { action });
    switch (action) {
      case HMSUpdateListenerActions.ON_PREVIEW:
        this.onPreviewDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_JOIN:
        this.onJoinDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_ROOM_UPDATE:
        this.onRoomDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_PEER_UPDATE:
        this.onPeerDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_TRACK_UPDATE:
        this.onTrackDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_ERROR:
        this.onErrorDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_MESSAGE:
        this.onMessageDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_SPEAKER:
        this.onSpeakerDelegate = null;
        break;
      case HMSUpdateListenerActions.RECONNECTING:
        this.onReconnectingDelegate = null;
        break;
      case HMSUpdateListenerActions.RECONNECTED:
        this.onReconnectedDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_ROLE_CHANGE_REQUEST:
        this.onRoleChangeRequestDelegate = null;
        break;
      case HMSUpdateListenerActions.ON_REMOVED_FROM_ROOM:
        this.onRemovedFromRoomDelegate = null;
        break;
      default:
    }
  };

  /**
   * removes all the listeners
   *
   * @memberof HMSSDK
   */
  removeAllListeners = () => {
    this.onPreviewDelegate = null;
    this.onJoinDelegate = null;
    this.onRoomDelegate = null;
    this.onPeerDelegate = null;
    this.onTrackDelegate = null;
    this.onErrorDelegate = null;
    this.onMessageDelegate = null;
    this.onSpeakerDelegate = null;
    this.onReconnectingDelegate = null;
    this.onReconnectedDelegate = null;
    this.onRoleChangeRequestDelegate = null;
    this.onRemovedFromRoomDelegate = null;

    this.logger?.verbose('REMOVE_ALL_LISTENER', {});
  };

  setLogger = (hmsLogger: HMSLogger) => {
    this.logger = hmsLogger;
    hmsLogger.verbose('UPDATE_LOGGER', { hmsLogger });
  };

  onPreviewListener = (data: any) => {
    this.logger?.verbose('ON_PREVIEW', data);
    const room: HMSRoom = HMSEncoder.encodeHmsRoom(data.room);
    const localPeer: HMSLocalPeer = HMSEncoder.encodeHmsLocalPeer(
      data.localPeer
    );

    const previewTracks = HMSEncoder.encodeHmsPreviewTracks(data.previewTracks);

    this.localPeer = localPeer;
    this.room = room;
    if (this.onPreviewDelegate) {
      this.logger?.verbose('ON_PREVIEW_LISTENER_CALL', {
        ...data,
        room,
        localPeer,
        previewTracks,
      });
      this.onPreviewDelegate({ ...data, room, localPeer, previewTracks });
    }
  };

  onJoinListener = (data: any) => {
    this.logger?.verbose('ON_JOIN', data);
    // Preprocessing
    const room: HMSRoom = HMSEncoder.encodeHmsRoom(data.room);
    const localPeer: HMSLocalPeer = HMSEncoder.encodeHmsLocalPeer(
      data.localPeer
    );
    const remotePeers: HMSRemotePeer[] = HMSEncoder.encodeHmsRemotePeers(
      data.remotePeers
    );
    const roles: HMSRole[] = HMSEncoder.encodeHmsRoles(data.roles);
    this.room = room;
    this.localPeer = localPeer;
    this.remotePeers = remotePeers;
    this.knownRoles = roles;
    if (this.onJoinDelegate) {
      this.logger?.verbose('ON_JOIN_LISTENER_CALL', {
        ...data,
        room,
        localPeer,
        remotePeers,
      });
      this.onJoinDelegate({ ...data, room, localPeer, remotePeers });
    }
  };

  onRoomListener = (data: any) => {
    this.logger?.verbose('ON_ROOM', data);
    const room: HMSRoom = HMSEncoder.encodeHmsRoom(data.room);
    const localPeer: HMSLocalPeer = HMSEncoder.encodeHmsLocalPeer(
      data.localPeer
    );
    const remotePeers: HMSRemotePeer[] = HMSEncoder.encodeHmsRemotePeers(
      data.remotePeers
    );
    this.room = room;
    this.localPeer = localPeer;
    this.remotePeers = remotePeers;
    if (this.onRoomDelegate) {
      this.logger?.verbose('ON_ROOM_LISTENER_CALL', {
        ...data,
        room,
        localPeer,
        remotePeers,
      });
      this.onRoomDelegate({ ...data, room, localPeer, remotePeers });
    }
  };

  onPeerListener = (data: any) => {
    this.logger?.verbose('ON_PEER', data);
    const localPeer: HMSLocalPeer = HMSEncoder.encodeHmsLocalPeer(
      data.localPeer
    );
    const remotePeers: HMSRemotePeer[] = HMSEncoder.encodeHmsRemotePeers(
      data.remotePeers
    );
    // this.room = room;
    this.localPeer = localPeer;
    this.remotePeers = remotePeers;
    if (this.onPeerDelegate) {
      this.logger?.verbose('ON_PEER_LISTENER_CALL', data);
      this.onPeerDelegate({ ...data, localPeer, remotePeers });
    }
  };

  onTrackListener = (data: any) => {
    this.logger?.verbose('ON_TRACK', data);
    // const room: HMSRoom = HMSEncoder.encodeHmsRoom(data.room);
    const localPeer: HMSLocalPeer = HMSEncoder.encodeHmsLocalPeer(
      data.localPeer
    );
    const remotePeers: HMSRemotePeer[] = HMSEncoder.encodeHmsRemotePeers(
      data.remotePeers
    );
    // this.room = room;
    this.localPeer = localPeer;
    this.remotePeers = remotePeers;
    if (this.onTrackDelegate) {
      this.logger?.verbose('ON_TRACK_LISTENER_CALL', data);
      this.onTrackDelegate({ ...data, localPeer, remotePeers });
    }
  };

  onMessageListener = (data: any) => {
    this.logger?.verbose('ON_MESSAGE', data);
    const message = new HMSMessage(data);
    if (this.onMessageDelegate) {
      this.logger?.verbose('ON_MESSAGE_LISTENER_CALL', message);
      this.onMessageDelegate(message);
    }
  };

  onSpeakerListener = (data: any) => {
    this.logger?.verbose('ON_SPEAKER', data);
    if (this.onSpeakerDelegate) {
      this.onSpeakerDelegate(data);
    }
  };

  onErrorListener = (data: any) => {
    this.logger?.warn('ON_ERROR', data);
    if (this.onErrorDelegate) {
      this.logger?.warn('ON_ERROR_LISTENER_CALL', data);
      this.onErrorDelegate(data);
    }
  };

  onRoleChangeRequestListener = (data: any) => {
    this.logger?.verbose('ON_ROLE_CHANGE_REQUEST', data);
    if (this.onRoleChangeRequestDelegate) {
      const encodedRoleChangeRequest =
        HMSEncoder.encodeHmsRoleChangeRequest(data);
      this.logger?.verbose(
        'ON_ROLE_CHANGE_LISTENER_CALL',
        encodedRoleChangeRequest
      );
      this.onRoleChangeRequestDelegate(encodedRoleChangeRequest);
    }
  };

  onRemovedFromRoomListener = (data: any) => {
    this.logger?.verbose('ON_REMOVED_FROM_ROOM', data);
    if (this.onRemovedFromRoomDelegate) {
      const requestedBy = HMSEncoder.encodeHmsPeer(data.requestedBy);
      const reason = data.reason;
      const roomEnded = data.roomEnded;

      this.logger?.verbose('ON_REMOVED_FROM_ROOM_LISTENER_CALL', {
        requestedBy,
        reason,
        roomEnded,
      });
      this.onRemovedFromRoomDelegate({ requestedBy, reason, roomEnded });
    }
  };

  reconnectingListener = (data: any) => {
    this.logger?.verbose('ON_RECONNECTING', data);
    if (this.onReconnectingDelegate) {
      this.onReconnectingDelegate(data);
    }
  };

  reconnectedListener = (data: any) => {
    this.logger?.verbose('ON_RECONNECTED', data);
    if (this.onReconnectedDelegate) {
      this.onReconnectedDelegate(data);
    }
  };
}
