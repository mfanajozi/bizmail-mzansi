import { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonMenuButton,
  IonToggle,
  IonInput,
  IonTextarea,
  IonToast,
} from '@ionic/react';
import { v4 as uuidv4 } from 'uuid';

interface OooSettings {
  account_id: string;
  is_enabled: boolean;
  start_date: string;
  end_date: string;
  message: string;
}

interface Account {
  id: string;
  email: string;
  name: string;
}

const SettingsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [oooSettings, setOooSettings] = useState<OooSettings | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  const [formData, setFormData] = useState({
    is_enabled: false,
    start_date: '',
    end_date: '',
    message: 'I am currently out of office. I will respond when I return.',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadOooSettings();
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const data = await (window as any).electronAPI.db.getAllAccounts();
      setAccounts(data || []);
      if (data && data.length > 0) {
        setSelectedAccount(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const loadOooSettings = async () => {
    try {
      const settings = await (window as any).electronAPI.db.getOooSettings(selectedAccount);
      if (settings) {
        setOooSettings(settings);
        setFormData({
          is_enabled: Boolean(settings.is_enabled),
          start_date: settings.start_date || '',
          end_date: settings.end_date || '',
          message: settings.message || formData.message,
        });
      } else {
        setOooSettings(null);
        setFormData({
          is_enabled: false,
          start_date: '',
          end_date: '',
          message: formData.message,
        });
      }
    } catch (error) {
      console.error('Failed to load OOO settings:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedAccount) {
      setToastMessage('Please select an account');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    try {
      const settings = {
        id: oooSettings?.id || uuidv4(),
        account_id: selectedAccount,
        is_enabled: formData.is_enabled,
        start_date: formData.start_date,
        end_date: formData.end_date,
        message: formData.message,
      };

      await (window as any).electronAPI.db.saveOooSettings(settings);
      setToastMessage('Settings saved');
      setToastColor('success');
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to save settings');
      setToastColor('danger');
    }
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel position="stacked">Account</IonLabel>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              style={{ width: '100%', padding: '10px' }}
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.email}
                </option>
              ))}
            </select>
          </IonItem>
        </IonList>

        <IonList>
          <IonItem>
            <IonLabel>Out of Office</IonLabel>
            <IonToggle
              checked={formData.is_enabled}
              onIonChange={(e) => setFormData(prev => ({ ...prev, is_enabled: e.detail.checked }))}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Start Date</IonLabel>
            <IonInput
              type="datetime-local"
              value={formData.start_date}
              onIonChange={(e) => setFormData(prev => ({ ...prev, start_date: e.detail.value! }))}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">End Date</IonLabel>
            <IonInput
              type="datetime-local"
              value={formData.end_date}
              onIonChange={(e) => setFormData(prev => ({ ...prev, end_date: e.detail.value! }))}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Auto-reply Message</IonLabel>
            <IonTextarea
              value={formData.message}
              onIonChange={(e) => setFormData(prev => ({ ...prev, message: e.detail.value! }))}
              rows={4}
            />
          </IonItem>

          <IonItem lines="none">
            <IonButton expand="block" onClick={handleSave}>
              Save Settings
            </IonButton>
          </IonItem>
        </IonList>

        <IonToast
          isOpen={showToast}
          message={toastMessage}
          color={toastColor as any}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;