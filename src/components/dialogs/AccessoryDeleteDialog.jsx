import React from 'react';
import {
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Button,
} from '@chakra-ui/react';

const AccessoryDeleteDialog = ({
                          isOpen,
                          onClose,
                          cancelRef,
                          deleteItemId,
                          handleDelete,
                          isLoading,
                          loadingText,
                      }) => {
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
                        Are you sure you want to delete this item?
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="red"
                            onClick={() => handleDelete(deleteItemId)}
                            isLoading={isLoading}
                            loadingText={loadingText}
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
