import { useState } from 'react';
import {
  IonApp,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonMenu,
} from '@ionic/react';
import { mailOutline, settingsOutline, cloudOutline, sendOutline } from 'ionicons/icons';
import InboxPage from './pages/InboxPage';
import ComposePage from './pages/ComposePage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import './App.css';

type PageName = 'inbox' | 'compose' | 'accounts' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageName>('inbox');

  const renderPage = () => {
    switch (currentPage) {
      case 'inbox':
        return <InboxPage />;
      case 'compose':
        return <ComposePage />;
      case 'accounts':
        return <AccountsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <InboxPage />;
    }
  };

  return (
    <IonApp>
      <IonMenu side="start" menuId="main-menu" contentId="main-content">
        <IonHeader>
          <IonToolbar>
            <IonTitle>BizMail Pro</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList>
            <IonItem button onClick={() => setCurrentPage('inbox')} lines="none">
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel>Inbox</IonLabel>
            </IonItem>
            <IonItem button onClick={() => setCurrentPage('compose')} lines="none">
              <IonIcon icon={sendOutline} slot="start" />
              <IonLabel>Compose</IonLabel>
            </IonItem>
            <IonItem button onClick={() => setCurrentPage('accounts')} lines="none">
              <IonIcon icon={cloudOutline} slot="start" />
              <IonLabel>Accounts</IonLabel>
            </IonItem>
            <IonItem button onClick={() => setCurrentPage('settings')} lines="none">
              <IonIcon icon={settingsOutline} slot="start" />
              <IonLabel>Settings</IonLabel>
            </IonItem>
          </IonList>
        </IonContent>
      </IonMenu>

      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>
              {currentPage === 'inbox' ? 'Inbox' : 
               currentPage === 'compose' ? 'Compose' :
               currentPage === 'accounts' ? 'Accounts' : 'Settings'}
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent id="main-content">
          {renderPage()}
        </IonContent>
      </IonPage>
    </IonApp>
  );
}

export default App;