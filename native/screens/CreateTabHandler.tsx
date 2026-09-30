import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CreateMenu } from '../components/ui/CreateMenu';

export default function CreateTabHandler() {
  const navigation = useNavigation();
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Show create menu when this tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setShowCreateMenu(true);
      return () => setShowCreateMenu(false);
    }, [])
  );

  const handleClose = () => {
    setShowCreateMenu(false);
    // Navigate back to Home tab
    (navigation as any).navigate('Home');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <CreateMenu 
        visible={showCreateMenu} 
        onClose={handleClose} 
      />
    </View>
  );
}
