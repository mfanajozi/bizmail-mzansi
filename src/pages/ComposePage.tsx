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
  IonInput,
  IonButton,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonMenuButton,
  IonLoading,
  IonToast,
} from '@ionic/react';

interface Account {
  id: string;
  email: string;
  name: string;
}

const ComposePage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState('success');

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await (window as any).electronAPI.db.getAllAccounts();
      setAccounts(data || []);
      if (data && data.length > 0) {
        setFrom(data[0].email);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setToastMessage('Please fill in recipient, subject, and body');
      setToastColor('warning');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      const account = accounts.find(a => a.email === from);
      if (!account) {
        throw new Error('No account selected');
      }

      const result = await (window as any).electronAPI.outbox.sendImmediate(
        account.id,
        to,
        subject,
        body,
        '',
        cc,
        ''
      );

      if (result.success) {
        setToastMessage('Email sent successfully');
        setToastColor('success');
        setTo('');
        setCc('');
        setSubject('');
        setBody('');
      } else {
        setToastMessage(result.error || 'Failed to send email');
        setToastColor('danger');
      }
      setShowToast(true);
    } catch (error: any) {
      setToastMessage(error.message || 'Failed to send email');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonMenuButton slot="start" />
          <IonTitle>Compose</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel position="stacked">From</IonLabel>
            <IonSelect 
              value={from} 
              onIonChange={(e) => setFrom(e.detail.value)}
              style={{ width: '100%' }}
            >
              {accounts.map((account) => (
                <IonSelectOption key={account.id} value={account.email}>
                  {account.email} ({account.name})
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">To</IonLabel>
            <IonInput 
              type="email" 
              value={to} 
              onIonChange={(e) => setTo(e.detail.value!)} 
              placeholder="recipient@example.com"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">CC</IonLabel>
            <IonInput 
              type="email" 
              value={cc} 
              onIonChange={(e) => setCc(e.detail.value!)} 
              placeholder="cc@example.com"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Subject</IonLabel>
            <IonInput 
              value={subject} 
              onIonChange={(e) => setSubject(e.detail.value!)} 
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Message</IonLabel>
            <IonTextarea 
              value={body} 
              onIonChange={(e) => setBody(e.detail.value!)} 
              rows={10}
              placeholder="Write your message..."
            />
          </IonItem>

          <IonItem lines="none">
            <IonButton 
              expand="block" 
              onClick={handleSend} 
              disabled={loading || !from || !to}
            >
              Send
            </IonButton>
          </IonItem>
        </IonList>

        <IonLoading isOpen={loading} message="Sending..." />
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

export default ComposePage;