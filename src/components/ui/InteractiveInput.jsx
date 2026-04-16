import { useState } from 'react';

export default function InteractiveInput({
    label,
    placeholder,
    icon,
    rightButton,
    type = 'text',
    value,
    onChange,
    required = false,
    disabled = false,
    ...rest
}) {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Calculate padding based on icons
    const hasLeftIcon = icon && icon.position === 'left';
    const hasRightIcon = (icon && icon.position === 'right') || rightButton;

    let paddingLeft = hasLeftIcon ? '48px' : '16px';
    let paddingRight = hasRightIcon ? '48px' : '16px';

    return (
        <div style={{ width: '100%', minWidth: '200px', position: 'relative' }}>
            {label && (
                <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#1E293B'
                }}>
                    {label}
                </label>
            )}
            <div style={{ position: 'relative', width: '100%' }}>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        width: '100%',
                        padding: `14px ${paddingRight} 14px ${paddingLeft}`,
                        fontSize: '15px',
                        border: '2px solid #E2E8F0',
                        borderRadius: '12px',
                        outline: 'none',
                        backgroundColor: disabled ? '#F8FAFC' : 'white',
                        color: '#1E293B',
                        transition: 'all 0.3s ease',
                        fontWeight: 400
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = '#F97316';
                        e.target.style.backgroundColor = '#FAFAFA';
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = '#E2E8F0';
                        e.target.style.backgroundColor = disabled ? '#F8FAFC' : 'white';
                    }}
                    {...rest}
                />

                {/* Top glow effect */}
                {isHovering && (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                zIndex: 20,
                                borderTopLeftRadius: '12px',
                                borderTopRightRadius: '12px',
                                overflow: 'hidden',
                                background: `radial-gradient(40px circle at ${mousePosition.x}px 0px, #F97316 0%, transparent 70%)`
                            }}
                        />
                        {/* Bottom glow effect */}
                        <div
                            style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                zIndex: 20,
                                borderBottomLeftRadius: '12px',
                                borderBottomRightRadius: '12px',
                                overflow: 'hidden',
                                background: `radial-gradient(40px circle at ${mousePosition.x}px 2px, #F97316 0%, transparent 70%)`
                            }}
                        />
                        {/* Left glow effect */}
                        <div
                            style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                width: '2px',
                                zIndex: 20,
                                borderTopLeftRadius: '12px',
                                borderBottomLeftRadius: '12px',
                                overflow: 'hidden',
                                background: `radial-gradient(40px circle at 0px ${mousePosition.y}px, #F97316 0%, transparent 70%)`
                            }}
                        />
                        {/* Right glow effect */}
                        <div
                            style={{
                                position: 'absolute',
                                pointerEvents: 'none',
                                top: 0,
                                bottom: 0,
                                right: 0,
                                width: '2px',
                                zIndex: 20,
                                borderTopRightRadius: '12px',
                                borderBottomRightRadius: '12px',
                                overflow: 'hidden',
                                background: `radial-gradient(40px circle at 2px ${mousePosition.y}px, #F97316 0%, transparent 70%)`
                            }}
                        />
                    </>
                )}

                {/* Left Icon */}
                {icon && icon.position === 'left' && (
                    <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {icon.element}
                    </div>
                )}

                {/* Right Icon */}
                {icon && icon.position === 'right' && (
                    <div style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20,
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        {icon.element}
                    </div>
                )}

                {/* Right Button (for password toggle, etc.) */}
                {rightButton && (
                    <div style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 20
                    }}>
                        {rightButton}
                    </div>
                )}
            </div>
        </div>
    );
}
