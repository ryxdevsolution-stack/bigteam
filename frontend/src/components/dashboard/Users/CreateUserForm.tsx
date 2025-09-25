import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X
} from 'lucide-react'
import { CreateUserPayload, userService } from '../../../services/userService'

interface CreateUserFormProps {
  onSubmit: (data: CreateUserPayload) => Promise<any>
  loading: boolean
  error: string | null
  onClearError: () => void
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({
  onSubmit,
  loading,
  error,
  onClearError
}) => {
  const [formData, setFormData] = useState<CreateUserPayload>({
    full_name: '',
    email: '',
    username: '',
    password: '',
    role: 'customer',
    referred_by: ''
  })

  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)

  const passwordStrength = {
    hasMinLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }

  const passwordStrengthScore = Object.values(passwordStrength).filter(Boolean).length

  // Debounce function for async validation
  useEffect(() => {
    if (formData.email && touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) === false) {
      const timer = setTimeout(async () => {
        setCheckingEmail(true)
        try {
          const exists = await userService.checkEmailExists(formData.email)
          if (exists) {
            setValidationErrors(prev => ({
              ...prev,
              email: 'Email already taken'
            }))
          } else {
            setValidationErrors(prev => {
              const newErrors = { ...prev }
              if (newErrors.email === 'Email already taken') {
                delete newErrors.email
              }
              return newErrors
            })
          }
        } catch (error) {
          console.error('Error checking email:', error)
        } finally {
          setCheckingEmail(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.email, touched.email])

  useEffect(() => {
    if (formData.username && touched.username && formData.username.length >= 3) {
      const timer = setTimeout(async () => {
        setCheckingUsername(true)
        try {
          const exists = await userService.checkUsernameExists(formData.username)
          if (exists) {
            setValidationErrors(prev => ({
              ...prev,
              username: 'Username already taken'
            }))
          } else {
            setValidationErrors(prev => {
              const newErrors = { ...prev }
              if (newErrors.username === 'Username already taken') {
                delete newErrors.username
              }
              return newErrors
            })
          }
        } catch (error) {
          console.error('Error checking username:', error)
        } finally {
          setCheckingUsername(false)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [formData.username, touched.username])

  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {}

    switch (name) {
      case 'full_name':
        if (!value.trim()) {
          errors.full_name = 'Full name is required'
        } else if (value.length < 2) {
          errors.full_name = 'Full name must be at least 2 characters'
        }
        break

      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address'
        }
        // Don't override "Email already taken" error
        if (validationErrors.email === 'Email already taken' && !errors.email) {
          return true
        }
        break

      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required'
        } else if (value.length < 3) {
          errors.username = 'Username must be at least 3 characters'
        } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
          errors.username = 'Username can only contain letters and numbers'
        }
        // Don't override "Username already taken" error
        if (validationErrors.username === 'Username already taken' && !errors.username) {
          return true
        }
        break

      case 'password':
        if (!value) {
          errors.password = 'Password is required'
        } else if (passwordStrengthScore < 3) {
          errors.password = 'Password is too weak'
        }
        // Also check if confirm password matches when password changes
        if (confirmPassword && value !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match'
          setValidationErrors(prev => ({
            ...prev,
            confirmPassword: 'Passwords do not match'
          }))
        } else if (confirmPassword && value === confirmPassword) {
          setValidationErrors(prev => ({
            ...prev,
            confirmPassword: ''
          }))
        }
        break

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password'
        } else if (value !== formData.password) {
          errors.confirmPassword = 'Passwords do not match'
        }
        break
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: errors[name] || ''
    }))

    return !errors[name]
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'confirmPassword') {
      setConfirmPassword(value)
      if (touched.confirmPassword) {
        validateField('confirmPassword', value)
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      if (touched[name]) {
        validateField(name, value)
      }
    }

    // Clear global error when user starts typing
    if (error) {
      onClearError()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields including confirm password
    const fieldsToValidate = ['full_name', 'email', 'username', 'password']
    let isValid = true

    fieldsToValidate.forEach(field => {
      const value = formData[field as keyof CreateUserPayload] as string
      if (!validateField(field, value)) {
        isValid = false
      }
      setTouched(prev => ({ ...prev, [field]: true }))
    })

    // Validate confirm password
    if (!validateField('confirmPassword', confirmPassword)) {
      isValid = false
    }
    setTouched(prev => ({ ...prev, confirmPassword: true }))

    if (!isValid) return

    // Don't submit if passwords don't match
    if (formData.password !== confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }))
      return
    }

    try {
      await onSubmit(formData)

      // Reset form on success
      setFormData({
        full_name: '',
        email: '',
        username: '',
        password: '',
        role: 'customer',
        referred_by: ''
      })
      setConfirmPassword('')
      setTouched({})
      setValidationErrors({})
    } catch (err) {
      // Error is handled by parent component
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrengthScore <= 2) return 'bg-red-500'
    if (passwordStrengthScore <= 3) return 'bg-yellow-500'
    if (passwordStrengthScore <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrengthScore <= 2) return 'Weak'
    if (passwordStrengthScore <= 3) return 'Fair'
    if (passwordStrengthScore <= 4) return 'Good'
    return 'Strong'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-dark-900 rounded-2xl p-6 shadow-lg border border-light-200 dark:border-dark-700"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Enter full name"
                autoComplete="off"
                className={`w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.full_name && touched.full_name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-light-300 dark:border-dark-600 focus:ring-accent-bitcoin'
                }`}
                disabled={loading}
              />
            </div>
            {validationErrors.full_name && touched.full_name && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="user@example.com"
                autoComplete="off"
                className={`w-full pl-10 pr-10 py-3 bg-light-50 dark:bg-dark-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.email && touched.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-light-300 dark:border-dark-600 focus:ring-accent-bitcoin'
                }`}
                disabled={loading}
              />
              {checkingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-accent-bitcoin border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {validationErrors.email && touched.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                {validationErrors.email === 'Email already taken' && <X className="w-3 h-3" />}
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Username *
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Enter username"
                autoComplete="off"
                className={`w-full pl-10 pr-10 py-3 bg-light-50 dark:bg-dark-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.username && touched.username
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-light-300 dark:border-dark-600 focus:ring-accent-bitcoin'
                }`}
                disabled={loading}
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-accent-bitcoin border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            {validationErrors.username && touched.username && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                {validationErrors.username === 'Username already taken' && <X className="w-3 h-3" />}
                {validationErrors.username}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              User Role *
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                name="role"
                value="Customer"
                readOnly
                className="w-full pl-10 pr-4 py-3 bg-light-100 dark:bg-dark-900 border border-light-300 dark:border-dark-600 rounded-lg text-dark-600 dark:text-dark-400 cursor-not-allowed"
                disabled={true}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Enter secure password"
                autoComplete="new-password"
                className={`w-full pl-10 pr-12 py-3 bg-light-50 dark:bg-dark-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.password && touched.password
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-light-300 dark:border-dark-600 focus:ring-accent-bitcoin'
                }`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.password && touched.password && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.password}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-light-200 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrengthScore / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-dark-600 dark:text-dark-400">
                    {getPasswordStrengthText()}
                  </span>
                </div>

                <div className="space-y-1">
                  {[
                    { check: passwordStrength.hasMinLength, text: 'At least 8 characters' },
                    { check: passwordStrength.hasUpperCase, text: 'One uppercase letter' },
                    { check: passwordStrength.hasLowerCase, text: 'One lowercase letter' },
                    { check: passwordStrength.hasNumber, text: 'One number' },
                    { check: passwordStrength.hasSpecial, text: 'One special character' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      {item.check ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <X className="w-3 h-3 text-dark-400" />
                      )}
                      <span className={item.check ? 'text-green-600 dark:text-green-400' : 'text-dark-500'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="Re-enter password"
                autoComplete="new-password"
                className={`w-full pl-10 pr-12 py-3 bg-light-50 dark:bg-dark-800 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                  validationErrors.confirmPassword && touched.confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : confirmPassword && !validationErrors.confirmPassword && formData.password === confirmPassword
                    ? 'border-green-500 focus:ring-green-500'
                    : 'border-light-300 dark:border-dark-600 focus:ring-accent-bitcoin'
                }`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {validationErrors.confirmPassword && touched.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{validationErrors.confirmPassword}</p>
            )}
            {!validationErrors.confirmPassword && touched.confirmPassword && confirmPassword && formData.password === confirmPassword && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Passwords match
              </p>
            )}
          </div>

          {/* Referred By */}
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
              Referred By (Optional)
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                name="referred_by"
                value={formData.referred_by}
                onChange={handleInputChange}
                placeholder="Referrer username or ID"
                className="w-full pl-10 pr-4 py-3 bg-light-50 dark:bg-dark-800 border border-light-300 dark:border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-bitcoin"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || Object.keys(validationErrors).some(key => validationErrors[key])}
            className="flex-1 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating User...' : 'Create User'}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({
                full_name: '',
                email: '',
                username: '',
                password: '',
                role: 'customer',
                referred_by: ''
              })
              setConfirmPassword('')
              setTouched({})
              setValidationErrors({})
              onClearError()
            }}
            disabled={loading}
            className="flex-1 sm:flex-none bg-light-200 dark:bg-dark-800 text-dark-700 dark:text-dark-300 py-3 px-6 rounded-lg font-medium hover:bg-light-300 dark:hover:bg-dark-700 transition-all disabled:opacity-50"
          >
            Reset Form
          </button>
        </div>
      </form>
    </motion.div>
  )
}

export default CreateUserForm