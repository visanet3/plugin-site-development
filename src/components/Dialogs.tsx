import { User } from '@/types';
import { AuthDialog } from '@/components/dialogs/AuthDialog';
import { ProfileDialog } from '@/components/dialogs/ProfileDialog';
import CreateTopicDialog from '@/components/forum/CreateTopicDialog';

interface DialogsProps {
  authDialogOpen: boolean;
  authMode: 'login' | 'register';
  showTopicDialog: boolean;
  showProfileDialog: boolean;
  user: User | null;
  newTopicTitle: string;
  newTopicContent: string;
  onAuthDialogChange: (open: boolean) => void;
  onAuthModeChange: (mode: 'login' | 'register') => void;
  onAuthSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onTopicDialogChange: (open: boolean) => void;
  onTopicTitleChange: (title: string) => void;
  onTopicContentChange: (content: string) => void;
  onCreateTopic: () => void;
  onProfileDialogChange: (open: boolean) => void;
  onUpdateProfile: (profileData: Partial<User>) => void;
  onAuthDialogAttemptClose?: () => void;
  onTopicCreated?: () => void;
}

const Dialogs = ({
  authDialogOpen,
  authMode,
  showTopicDialog,
  showProfileDialog,
  user,
  newTopicTitle,
  newTopicContent,
  onAuthDialogChange,
  onAuthModeChange,
  onAuthSubmit,
  onTopicDialogChange,
  onTopicTitleChange,
  onTopicContentChange,
  onCreateTopic,
  onProfileDialogChange,
  onUpdateProfile,
  onAuthDialogAttemptClose,
  onTopicCreated,
}: DialogsProps) => {
  return (
    <>
      <AuthDialog
        authDialogOpen={authDialogOpen}
        authMode={authMode}
        user={user}
        onAuthDialogChange={onAuthDialogChange}
        onAuthModeChange={onAuthModeChange}
        onAuthSubmit={onAuthSubmit}
        onAuthDialogAttemptClose={onAuthDialogAttemptClose}
      />

      <ProfileDialog
        showProfileDialog={showProfileDialog}
        user={user}
        onProfileDialogChange={onProfileDialogChange}
        onUpdateProfile={onUpdateProfile}
      />

      <CreateTopicDialog
        open={showTopicDialog}
        newTopicTitle={newTopicTitle}
        newTopicContent={newTopicContent}
        onOpenChange={onTopicDialogChange}
        onTitleChange={onTopicTitleChange}
        onContentChange={onTopicContentChange}
        onCreate={onCreateTopic}
        onTopicCreated={onTopicCreated}
      />
    </>
  );
};

export default Dialogs;
