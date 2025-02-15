import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Card,
    CardBody,
    Heading,
    Stack,
    Text,
    useToast,
    VStack,
    Icon,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    useDisclosure,
    Input,
    InputGroup,
    InputLeftElement,
    Spinner,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td
} from '@chakra-ui/react';
import { FiKey, FiTrash2, FiSearch, FiUser } from 'react-icons/fi';
import { auth, firestore } from "components/firebase/firebase.js";
import { collection, getDocs, doc, getDoc, updateDoc, query, where } from "firebase/firestore";

const AdminPasskeyManager = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCredential, setSelectedCredential] = useState(null);
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = React.useRef();

    const fetchUsers = async () => {
        try {
            setIsLoading(true);

            // Check if current user is admin
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }

            const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
            if (!userDoc.exists() || userDoc.data().role !== 'admin') {
                throw new Error('Insufficient permissions');
            }

            // Proceed with fetching users
            const usersRef = collection(firestore, 'users');
            const usersSnapshot = await getDocs(usersRef);

            const usersData = await Promise.all(usersSnapshot.docs.map(async (doc) => {
                const userData = doc.data();
                return {
                    uid: doc.id,
                    email: userData.email || 'No email',
                    credentials: userData.credentials || [],
                    ...userData
                };
            }));

            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({
                status: "error",
                description: error.message || "Failed to load users",
            });
        } finally {
            setIsLoading(false);
        }
    };
    const handleDeletePasskey = async () => {
        if (!selectedUser || !selectedCredential) return;

        try {
            const userDocRef = doc(firestore, 'users', selectedUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }

            const updatedCredentials = userDoc.data().credentials.filter(
                cred => cred.credentialID !== selectedCredential.credentialID
            );

            await updateDoc(userDocRef, {
                credentials: updatedCredentials
            });

            // Update local state
            setUsers(users.map(user => {
                if (user.uid === selectedUser.uid) {
                    return {
                        ...user,
                        credentials: updatedCredentials
                    };
                }
                return user;
            }));

            toast({
                status: "success",
                description: "Passkey deleted successfully",
            });
        } catch (error) {
            console.error('Error deleting credential:', error);
            toast({
                status: "error",
                description: "Failed to delete passkey",
            });
        } finally {
            onClose();
            setSelectedUser(null);
            setSelectedCredential(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <Box p={8} maxW="1200px" mx="auto">
            <VStack spacing={6} align="stretch">
                <Stack direction={["column", "row"]} justify="space-between" align="center">
                    <Heading size="lg">Admin Passkey Manager</Heading>
                    <InputGroup maxW="300px">
                        <InputLeftElement>
                            <Icon as={FiSearch} color="gray.500" />
                        </InputLeftElement>
                        <Input
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Stack>

                {isLoading ? (
                    <Card>
                        <CardBody>
                            <Stack direction="row" justify="center" align="center" spacing={4}>
                                <Spinner />
                                <Text>Loading users...</Text>
                            </Stack>
                        </CardBody>
                    </Card>
                ) : (
                    <Table variant="simple">
                        <Thead>
                            <Tr>
                                <Th>User</Th>
                                <Th>Passkeys</Th>
                                <Th>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {filteredUsers.map((user) => (
                                <Tr key={user.uid}>
                                    <Td>
                                        <Stack direction="row" align="center" spacing={4}>
                                            <Icon as={FiUser} />
                                            <Box>
                                                <Text fontWeight="medium">{user.email}</Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    {user.uid}
                                                </Text>
                                            </Box>
                                        </Stack>
                                    </Td>
                                    <Td>
                                        <Text>{user.credentials?.length || 0} passkeys</Text>
                                    </Td>
                                    <Td>
                                        {user.credentials?.map((credential, index) => (
                                            <Button
                                                key={index}
                                                size="sm"
                                                leftIcon={<Icon as={FiTrash2} />}
                                                colorScheme="red"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSelectedCredential(credential);
                                                    onOpen();
                                                }}
                                                mr={2}
                                                mb={2}
                                            >
                                                Delete Passkey {index + 1}
                                            </Button>
                                        ))}
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                )}
            </VStack>

            <AlertDialog
                isOpen={isOpen}
                leastDestructiveRef={cancelRef}
                onClose={onClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>Delete Passkey</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this passkey for user {selectedUser?.email}?
                            This action cannot be undone.
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDeletePasskey} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default AdminPasskeyManager;