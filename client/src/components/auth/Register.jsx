import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Eye, EyeOff, CheckCircle } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "user",
  })
  const [formError, setFormError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const { register, loading, error, clearError } = useAuth()
  const navigate = useNavigate()

  const { name, email, password, confirmPassword, phone, role } = formData

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFormError("")
    setSuccessMessage("")
    clearError()
  }

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value })
    clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !password) {
      setFormError("Please provide all required fields")
      return
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters")
      return
    }

    try {
      const userData = { ...formData }
      delete userData.confirmPassword

      const response = await register(userData)
      
      if (response.success) {
        setSuccessMessage("Registration successful! Please check your email to verify your account.")
        
        // Redirect to wallet/home after 3 seconds
        setTimeout(() => {
          navigate("/wallet")
        }, 3000)
      }
    } catch (err) {
      console.error("Registration error:", err)
      setFormError(err.response?.data?.error || "Registration failed. Please try again.")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg">
        <CardHeader>
          <CardTitle className="text-3xl">Register</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {formError && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                {formError}
              </div>
            )}
            
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-md text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="me@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-10 sm:h-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="h-10 sm:h-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                name="phone"
                value={phone}
                onChange={handleChange}
                placeholder="1234567890"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Register as</Label>
              <Select value={role} onValueChange={handleRoleChange} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Role</SelectLabel>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="merchant">Merchant</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}

export default Register