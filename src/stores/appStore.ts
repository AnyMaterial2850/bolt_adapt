import { create } from 'zustand';


interface AppStore {
    hasUnsavedChanges: boolean;
    showConfirmDialog: boolean;
    pendingNavigation: boolean;
    nextNavigationPage: string | number;
    activeTab: string;
    setShowConfirmDialog: (showConfirmDialog: boolean) => void;
    setPendingNavigation: (pendingNavigation: boolean) => void;
    setHasUnsavedChanges: (hasUnsavedChanges: boolean) => void;
    setNextNavigationPage: (nextNavigationPage: string | number) => void;    
    setActiveTab: (activeTab: string) => void;
}

const useAppStore = create<AppStore>(set => ({
    hasUnsavedChanges: false,
    showConfirmDialog: false,   
    pendingNavigation: false,
    nextNavigationPage: -1,
    activeTab: 'habits',
    setShowConfirmDialog: (showConfirmDialog: boolean) => set({ showConfirmDialog }),
    setPendingNavigation: (pendingNavigation: boolean) => set({ pendingNavigation }),
    setHasUnsavedChanges: (hasUnsavedChanges: boolean) => set({ hasUnsavedChanges }),
    setNextNavigationPage: (nextNavigationPage: string | number) => set({ nextNavigationPage }),
    setActiveTab: (activeTab: string) => set({ activeTab })
}))

export default useAppStore;