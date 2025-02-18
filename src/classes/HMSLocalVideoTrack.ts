import { NativeModules } from 'react-native';
import { HMSVideoTrack } from './HMSVideoTrack';
import type { HMSVideoTrackSettings } from './HMSVideoTrackSettings';

const {
  /**
   * @ignore
   */
  HmsManager,
} = NativeModules;

export class HMSLocalVideoTrack extends HMSVideoTrack {
  settings?: HMSVideoTrackSettings;
  startCapturing?: Function;
  stopCapturing?: Function;

  /**
   * switches camera between front/back
   *
   * @memberof HMSSDK
   */
  switchCamera = () => {
    HmsManager.switchCamera();
  };

  /**
   * Switches local video feed on/off depending upon the value of isMute
   *
   * @param {boolean} isMute
   * @memberof HMSLocalVideoTrack
   */
  setMute(isMute: boolean) {
    HmsManager.setLocalVideoMute(isMute);
  }

  constructor(params: {
    trackId: string;
    source?: number | string;
    trackDescription?: string;
    isMute?: boolean;
    settings?: HMSVideoTrackSettings;
  }) {
    super(params);
    this.settings = params.settings;
  }
}
