import { useState, useEffect } from 'react';
import {
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
} from '@ionic/react';
import { mailUnreadOutline, checkmarkCircleOutline, refreshOutline } from 'ionicons/icons';

interface Email {
  id: string;
  account_id: string;
  sender: string;
  subject: string;
  body_text: string;
  body_html: string;
  date_received: string;
  folder_type: string;
  is_read: boolean;
  account_email?: string;
  account_color?: string;
}

const InboxPage: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadEmails = async () => {
    try {
      const data = await (window as any).electronAPI.db.getAllEmails(100);
      setEmails(data || []);
    } catch (error) {
      console.error('Failed to load emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await (window as any).electronAPI.sync.syncAll();
      await loadEmails();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRefresh = async (event: any) => {
    await handleSync();
    event.target.complete();
  };

  useEffect(() => {
    loadEmails();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredEmails = emails.filter(e => e.folder_type === 'inbox');

  return (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh as any}>
        <IonRefresherContent />
      </IonRefresher>

      <IonLoading isOpen={loading || syncing} message={syncing ? 'Syncing...' : 'Loading...'} />

      <IonList>
        {filteredEmails.length === 0 && !loading && (
          <IonItem lines="none">
            <IonLabel className="ion-text-center">
              No emails found. Pull down to sync.
            </IonLabel>
          </IonItem>
        )}
        
        {filteredEmails.map((email) => (
          <IonItem 
            key={email.id} 
            detail={false}
            lines="full"
          >
            <IonIcon 
              slot="start" 
              icon={email.is_read ? checkmarkCircleOutline : mailUnreadOutline} 
              color={email.is_read ? 'medium' : 'primary'}
            />
            <IonLabel className="ion-text-wrap">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {email.account_color && (
                  <div 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: email.account_color 
                    }} 
                  />
                )}
                <strong>{email.sender}</strong>
              </div>
              <h2>{email.subject}</h2>
              <p>{email.body_text?.substring(0, 100) || '(no preview)'}</p>
              <IonBadge color="medium" style={{ marginTop: '4px' }}>
                {formatDate(email.date_received)}
              </IonBadge>
            </IonLabel>
          </IonItem>
        ))}
      </IonList>
    </IonContent>
  );
};

export default InboxPage;