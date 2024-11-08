import React from 'react';
import {
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Button,
    useToast,
} from '@chakra-ui/react';
import useAccessoryStore from "components/zuhan/useAccessoryStore.js";


const AccessoryDeleteDialog = ({
                                   isOpen,
                                   onClose,
                                   cancelRef,
                                   deleteItemId,
                                   setSearchParam,
                                   currentPage,
                               }) => {
    const toast = useToast();
    const { deleteAccessory, isDeleting } = useAccessoryStore();

    const handleDelete = async () => {
        try {
            await deleteAccessory(
                deleteItemId,
                setSearchParam,
                onClose,
                toast
            );
        } catch (error) {
            console.error('Delete operation failed:', error);
            toast({
                status: 'error',
                description: 'Delete operation failed',
                position: 'bottom-right',
                isClosable: true
            });
        }
    };

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Delete Item
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        Are you sure you want to delete this item? This action cannot be undone.
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            ref={cancelRef}
                            onClick={onClose}
                            isDisabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                            loadingText="Deleting"
                            ml={3}
                        >
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default AccessoryDeleteDialog;