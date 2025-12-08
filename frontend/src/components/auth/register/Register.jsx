import React, { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/authcontext/Authcontext'
import { doCreateUserWithEmailAndPassword } from '../../../firebase/auth'
import './Register.css'

const Register = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const { userLoggedIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(!isRegistering) {
            setIsRegistering(true)
            if (password !== confirmPassword) {
                setErrorMessage("Passwords do not match")
                setIsRegistering(false)
                return
            }
            try {
                await doCreateUserWithEmailAndPassword(email, password)
                // Navigation handled by Navigate component below
            } catch (error) {
                setErrorMessage(error.message)
                setIsRegistering(false)
            }
        }
    }

    return (
        <>
            {userLoggedIn && (<Navigate to={'/home'} replace={true} />)}

            {/* Background Video */}
            <video className="background-video" autoPlay loop muted playsInline>
                <source src="https://github.com/AvinashJ74/AgriShop/assets/83860778/dcc330e0-3690-48f4-a135-073c038b6b38" type='video/mp4' />
            </video>

            <div className="form-container" style={{ minHeight: "100vh" }}>
                <form onSubmit={handleSubmit} className="auth-form">
                    <h4 className="title">Create Account</h4>
                    
                    <div className="mb-3">
                        <input
                            type="email"
                            autoFocus
                            autoComplete='email'
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-control"
                            placeholder="Enter Your Email"
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            type="password"
                            autoComplete='new-password'
                            required
                            disabled={isRegistering}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            placeholder="Enter Your Password"
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            type="password"
                            autoComplete='off'
                            required
                            disabled={isRegistering}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="form-control"
                            placeholder="Confirm Your Password"
                        />
                    </div>

                    {errorMessage && (
                        <div className="error-message">
                            {errorMessage}
                        </div>
                    )}

                    <div className="mb-3">
                        <button
                            type="button"
                            className="btn forgot-btn"
                            onClick={() => navigate("/login")}
                        >
                            Already have an account? Sign In
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isRegistering}
                    >
                        {isRegistering ? 'SIGNING UP...' : 'SIGN UP'}
                    </button>
                </form>
            </div>
        </>
    )
}

export default Register
