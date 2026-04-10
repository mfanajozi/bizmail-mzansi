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
  IonIcon,
  IonMenuButton,
  IonModal,
  IonInput,
  IonLoading,
  IonToast,
  IonProgressBar,
} from '@ionic/react';
import { addOutline, trashOutline, syncOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { v4 as uuidv4 } from 'uuid';

interface Account {
  id: string;
  email: string;
  name: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  total_storage: number;
  used_storage: number;
  color_tag: string;
}

const AccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [syncingAccount, setSyncingAccount] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    imap_host: '',
    imap_port: '993',
    smtp_host: '',
    smtp_port: '587',
    color_tag: '#3b82f6',
  });

  const loadAccounts = async () => {
    try {
      const data = await (window as any).electronAPI.db.getAllAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field === 'email' && value.includes('@')) {
      const domain = value.split('@')[1];
      if (domain && !formData.imap_host) {
        setFormData(prev => ({
          ...prev,
          imap_host: `imap.${domain}`,
          smtp_host: `smtp.${domain}`,
        }));
      }
    }
  };

  const handleAddAccount = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setToastMessage('Please fill in all required fields');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const id = uuidv4();
      await (window as any).electronAPI.db.createAccount({
        id,
        email: formData.email,
        name: formData.name,
        imap_host: formData.imap_host,
        imap_port: parseInt(formData.imap_port) || 993,
        smtp_host: formData.smtp_host,
        smtp_port: parseInt(formData.smtp_port) || 587,
        total_storage: 0,
        used_storage: 0,
        color_tag: formData.color_tag,
      });

      await (window as any).electronAPI.vault.setPassword(id, formData.password);

      setToastMessage('Account added successfully');
      setToastColor('success');
      setShowModal(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        imap_host: '',
        imap_port: '993',
        smtp_host: '',
        smtp_port: '587',
        color_tag: '#3b82f6',
      });
      loadAccounts();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to add account');
      setToastColor('danger');
    } finally {
      setLoading(false);
      setShowToast(true);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await (window as any).electronAPI.db.deleteAccount(id);
      setToastMessage('Account deleted');
      setToastColor('success');
      loadAccounts();
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to delete account');
      setToastColor('danger');
    }
    setShowToast(true);
  };

  const handleSyncAccount = async (id: string) => {
    setSyncingAccount(id);
    try {
      const result = await (window as any).electronAPI.sync.syncAccount(id);
      if (result.success) {
        setToastMessage(`Synced ${result.synced} emails`);
        setToastColor('success');
      } else {
        setToastMessage(result.error || 'Sync failed');
        setToastColor('danger');
      }
    } catch (error: any) {
      setToastMessage(error.message || 'Sync failed');
      setToastColor('danger');
    } finally {
      setSyncingAccount(null);
      setShowToast(true);
    }
  };

  const formatStorage = (mb: number) => {
    if (mb < 1024) return `${mb.toFixed(0)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Accounts</IonTitle>
          <IonButton slot="end" onClick={() => setShowModal(true)}>
            <IonIcon icon={addOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonLoading isOpen={loading} message="Loading..." />

        <IonList>
          {accounts.length === 0 && !loading && (
            <IonItem lines="none">
              <IonLabel class="ion-text-center">
                No accounts. Click + to add one.
              </IonLabel>
            </IonItem>
          )}

          {accounts.map((account) => (
            <IonItem key={account.id} lines="full">
              <div slot="start" style={{ 
                width: '4px', 
                height: '40px', 
                borderRadius: '2px', 
                backgroundColor: account.color_tag 
              }} />
              <IonLabel class="ion-text-wrap">
                <h2>{account.name}</h2>
                <p>{account.email}</p>
                <p>
                  <small>IMAP: {account.imap_host}:{account.imap_port}</small>
                </p>
                {account.total_storage > 0 && (
                  <IonProgressBar 
                    value={account.used_storage / account.total_storage} 
                    color={account.used_storage / account.total_storage > 0.9 ? 'danger' : 'primary'}
                  />
                )}
                <small>
                  Storage: {formatStorage(account.used_storage)} / {formatStorage(account.total_storage)}
                </small>
              </IonLabel>
              <IonButton 
                slot="end" 
                onClick={() => handleSyncAccount(account.id)}
                disabled={syncingAccount === account.id}
              >
                <IonIcon icon={syncOutline} />
              </IonButton>
              <IonButton 
                slot="end" 
                color="danger"
                onClick={() => handleDeleteAccount(account.id)}
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Add Account</IonTitle>
              <IonButton slot="end" onClick={() => setShowModal(false)}>
                <IonIcon icon={closeCircleOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Name *</IonLabel>
                <IonInput 
                  value={formData.name}
                  onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                  placeholder="My Account"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Email *</IonLabel>
                <IonInput 
                  type="email"
                  value={formData.email}
                  onIonChange={(e) => handleInputChange('email', e.detail.value!)}
                  placeholder="you@domain.com"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Password *</IonLabel>
                <IonInput 
                  type="password"
                  value={formData.password}
                  onIonChange={(e) => handleInputChange('password', e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">IMAP Host</IonLabel>
                <IonInput 
                  value={formData.imap_host}
                  onIonChange={(e) => handleInputChange('imap_host', e.detail.value!)}
                  placeholder="imap.domain.com"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">IMAP Port</IonLabel>
                <IonInput 
                  type="number"
                  value={formData.imap_port}
                  onIonChange={(e) => handleInputChange('imap_port', e.detail.value!)}
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">SMTP Host</IonLabel>
                <IonInput 
                  value={formData.smtp_host}
                  onIonChange={(e) => handleInputChange('smtp_host', e.detail.value!)}
                  placeholder="smtp.domain.com"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">SMTP Port</IonLabel>
                <IonInput 
                  type="number"
                  value={formData.smtp_port}
                  onIonChange={(e) => handleInputChange('smtp_port', e.detail.value!)}
                />
              </IonItem>
              <IonItem lines="none">
                <IonButton expand="block" onClick={handleAddAccount}>
                  Add Account
                </IonButton>
              </IonItem>
            </IonList>
          </IonContent>
        </IonModal>

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

export default AccountsPage;