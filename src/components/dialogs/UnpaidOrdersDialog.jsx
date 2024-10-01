import {
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Button
} from "@chakra-ui/react";

const UnpaidOrdersDialog = ({
                         isDialogOpen,
                         cancelRef,
                         cancelButton,
                         setDialogOpen,
                         sending,
                         refundId,
                         handleRefund
                     }) => {
    return (
        <AlertDialog
            isOpen={isDialogOpen}
            leastDestructiveRef={cancelRef}
            onClose={() => setDialogOpen(false)}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize={{ base: "lg", md: "xl" }} fontWeight="bold">
                        Return Item
                    </AlertDialogHeader>
                    <AlertDialogBody>Are you sure you want to refund this item?</AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} isDisabled={cancelButton} onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button isLoading={sending[refundId]} loadingText="Refunding.." colorScheme="green" onClick={handleRefund} ml={3}>
                            Refund
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default UnpaidOrdersDialog;
