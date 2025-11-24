import React from 'react';

interface AdminHeaderContextType {
    headerButtons: React.ReactNode[];
    setHeaderButtons: (buttons: React.ReactNode[]) => void;
}

const AdminHeaderContext = React.createContext<AdminHeaderContextType>({
    headerButtons: [],
    setHeaderButtons: () => {},
});

export default AdminHeaderContext;
