import { useCallback, useEffect, useState } from '@lynx-js/react';
import LynxLinking from 'rfc-test';
import { NativeLocalStorage as NativeLocalStorageModule } from 'local-storage-module';
import './App.css';

export function App(props: { onRender?: () => void }) {
  const [status, setStatus] = useState('Ready to test LynxLinking!');

  useEffect(() => {
    console.info('Hello, ReactLynx');
  }, []);
  props.onRender?.();

  // LynxLinking demo functions
  const handleOpenURL = useCallback(async () => {
    try {
      setStatus('Opening URL...');
      await LynxLinking.openURL('https://example.com');
      setStatus('URL opened successfully!');
    } catch (error) {
      setStatus(`Error opening URL: ${error}`);
    }
  }, []);

  const handleOpenSettings = useCallback(async () => {
    try {
      setStatus('Opening app settings...');
      await LynxLinking.openSettings();
      setStatus('Settings opened successfully!');
    } catch (error) {
      setStatus(`Error opening settings: ${error}`);
    }
  }, []);

  const handleSendIntent = useCallback(async () => {
    try {
      setStatus('Sending intent...');
      await LynxLinking.sendIntent('android.intent.action.VIEW', [
        { key: 'android.intent.extra.PHONE_NUMBER', value: '+9134567890' },
      ]);
      setStatus('Intent sent successfully!');
    } catch (error) {
      setStatus(`Error sending intent: ${error}`);
    }
  }, []);

  const handleShareText = useCallback(async () => {
    try {
      setStatus('Sharing text...');
      await LynxLinking.share('Hello from LynxJS!', {
        dialogTitle: 'Share Text',
      });
      setStatus('Text shared successfully!');
    } catch (error) {
      setStatus(`Error sharing text: ${error}`);
    }
  }, []);

  const handleShareFile = useCallback(async () => {
    try {
      setStatus('Sharing file...');
      await LynxLinking.share('file:///path/to/file.pdf', {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Document',
      });
      setStatus('File shared successfully!');
    } catch (error) {
      setStatus(`Error sharing file: ${error}`);
    }
  }, []);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  } as const;

  const contentBoxStyle = {
    border: '1px solid #ccc',
    padding: '2px',
    marginBottom: '20px',
    borderRadius: '5px',
    width: '300px',
    textAlign: 'center',
  } as const;

  const buttonContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: 'max-content',
  } as const;

  const buttonStyle = {
    padding: '2px',
    margin: '5px',
    backgroundColor: '#ec644c',
    borderRadius: '5px',
    fontSize: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    flexShrink: '0',
  };

  const textStyle = {
    fontSize: '18px',
    margin: '10px 0',
    color: '#333',
  };

  const buttonTextStyle = {
    fontSize: '18px',
    margin: '10px 0',
    color: '#fffffe',
    alignSelf: 'center',
  };
  const [storedValue, setStoredValue] = useState<string | null>(null);

  const setStorage = () => {
    NativeLocalStorageModule.setStorageItem('testKey', 'Hello, ReactLynx!');
    getStorage();
  };

  const getStorage = () => {
    NativeLocalStorageModule.getStorageItem('testKey', (value) => {
      setStoredValue(value);
    });
  };

  const clearStorage = () => {
    NativeLocalStorageModule.clearStorage();
    setStoredValue(null);
  };

  useEffect(() => {
    getStorage();
  }, []);
  return (
    <view className="" style={containerStyle}>
      {/* LynxLinking Demo Section */}
      <view
        style={{
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          margin: '20px',
        }}
      >
        <text
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '15px',
            textAlign: 'center',
          }}
        >
          LynxLinking Demo
        </text>

        <text
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '15px',
            textAlign: 'center',
          }}
        >
          {status}
        </text>

        <view style={{ flexDirection: 'column', gap: '10px' }}>
          <view
            bindtap={handleOpenURL}
            style={{
              backgroundColor: '#007bff',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <text style={{ color: 'white', fontSize: '16px' }}>
              Open URL (example.com)
            </text>
          </view>

          <view
            bindtap={handleOpenSettings}
            style={{
              backgroundColor: '#28a745',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <text style={{ color: 'white', fontSize: '16px' }}>
              Open App Settings
            </text>
          </view>

          <view
            bindtap={handleSendIntent}
            style={{
              backgroundColor: '#ffc107',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <text style={{ color: 'black', fontSize: '16px' }}>
              Send Intent (Call Phone)
            </text>
          </view>

          <view
            bindtap={handleShareText}
            style={{
              backgroundColor: '#17a2b8',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <text style={{ color: 'white', fontSize: '16px' }}>Share Text</text>
          </view>

          <view
            bindtap={handleShareFile}
            style={{
              backgroundColor: '#6f42c1',
              padding: '12px',
              borderRadius: '8px',
              alignItems: 'center',
            }}
          >
            <text style={{ color: 'white', fontSize: '16px' }}>
              Share File (PDF)
            </text>
          </view>
        </view>
      </view>
      <view style={contentBoxStyle}>
        <text style={textStyle}>
          Current stored value: {storedValue || 'None'}
        </text>
      </view>
      <view style={buttonContainerStyle}>
        <view style={buttonStyle} bindtap={setStorage}>
          <text style={buttonTextStyle}>Set storage: Hello, ReactLynx!</text>
        </view>
        <view style={buttonStyle} bindtap={getStorage}>
          <text style={buttonTextStyle}>Read storage</text>
        </view>
        <view style={buttonStyle} bindtap={clearStorage}>
          <text style={buttonTextStyle}>Clear storage</text>
        </view>
      </view>
    </view>
  );
}
