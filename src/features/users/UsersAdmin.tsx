import { useState, useEffect, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import Menu from "@/components/custom/Menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/context/ThemeToggler"
import { API_URL } from "../../config/api"
import { useAuth } from "@/context/AuthContext"
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react"

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["admin", "voter"]),
  admission_number: z.string().optional(),
})

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "voter"]),
  admission_number: z.string().optional(),
  isVerified: z.boolean(),
})

type UserFormValues = z.infer<typeof userSchema>
type UpdateFormValues = z.infer<typeof updateUserSchema>

interface User {
  id: string
  email: string
  username: string
  role: "admin" | "voter"
  admission_number?: string | null
  isVerified: boolean
  createdAt?: string
  updatedAt?: string
}

type ModalType = "create" | "edit" | "delete" | null

export default function UsersAdmin() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

  const itemsPerPage = 10

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/users`, { credentials: "include", headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      }
    } catch {
      showNotification("error", "Failed to fetch users")
    } finally {
      setIsLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "voter",
      admission_number: "",
    },
  })

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      email: "",
      role: "voter",
      admission_number: "",
      isVerified: false,
    },
  })

  const openCreateModal = () => {
    createForm.reset()
    setSelectedUser(null)
    setModalType("create")
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    editForm.reset({
      email: user.email,
      role: user.role,
      admission_number: user.admission_number || "",
      isVerified: user.isVerified,
    })
    setModalType("edit")
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setModalType("delete")
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedUser(null)
  }

  const handleCreate = async (data: UserFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (res.ok) {
        showNotification("success", "User created successfully")
        closeModal()
        fetchUsers()
      } else {
        const error = await res.json()
        showNotification("error", error.message || "Failed to create user")
      }
    } catch {
      showNotification("error", "Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async (data: UpdateFormValues) => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/users?id=${selectedUser.id}`, {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (res.ok) {
        showNotification("success", "User updated successfully")
        closeModal()
        fetchUsers()
      } else {
        const error = await res.json()
        showNotification("error", error.message || "Failed to update user")
      }
    } catch {
      showNotification("error", "Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/users?id=${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      })

      if (res.ok) {
        showNotification("success", "User deleted successfully")
        closeModal()
        fetchUsers()
      } else {
        showNotification("error", "Failed to delete user")
      }
    } catch {
      showNotification("error", "Network error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
            notification.type === "success"
              ? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"
          }`}
        >
          {notification.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-sm text-muted-foreground">
                Manage system users and permissions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {filteredUsers.length} Users
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchUsers}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <ThemeToggle />
            <Menu />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Voters</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.role === "voter").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <UserX className="h-6 w-6 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">
                  {users.filter((u) => u.isVerified).length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Card */}
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Admission Number</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "admin" ? "default" : "secondary"}
                              className={
                                user.role === "admin"
                                  ? "bg-purple-600 hover:bg-purple-700"
                                  : ""
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.admission_number || "—"}
                          </TableCell>
                          <TableCell>
                            {user.isVerified ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check className="h-4 w-4" />
                                <span className="text-sm">Yes</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <X className="h-4 w-4" />
                                <span className="text-sm">No</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-2 hover:bg-accent rounded-md"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeleteModal(user)}
                                className="p-2 hover:bg-accent text-red-600 rounded-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of{" "}
                      {filteredUsers.length} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <Dialog open={modalType === "create"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system. They will receive login credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                {...createForm.register("email")}
              />
              {createForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                {...createForm.register("password")}
              />
              {createForm.formState.errors.password && (
                <p className="text-sm text-red-500">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                onValueChange={(value) => createForm.setValue("role", value as "admin" | "voter")}
                defaultValue={createForm.getValues("role")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="voter">Voter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission_number">Admission Number</Label>
              <Input
                id="admission_number"
                placeholder="Optional"
                {...createForm.register("admission_number")}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={modalType === "edit"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...editForm.register("email")}
              />
              {editForm.formState.errors.email && (
                <p className="text-sm text-red-500">
                  {editForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                onValueChange={(value) => editForm.setValue("role", value as "admin" | "voter")}
                defaultValue={editForm.getValues("role")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="voter">Voter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-admission_number">Admission Number</Label>
              <Input
                id="edit-admission_number"
                {...editForm.register("admission_number")}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="isVerified">Verified Status</Label>
                <p className="text-sm text-muted-foreground">
                  User has completed verification
                </p>
              </div>
              <Switch
                id="isVerified"
                checked={editForm.watch("isVerified")}
                onCheckedChange={(checked) => editForm.setValue("isVerified", checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={modalType === "delete"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-800 dark:text-red-400">
                {selectedUser.email}
              </p>
              <p className="text-sm text-red-600 dark:text-red-500">
                Role: {selectedUser.role}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
