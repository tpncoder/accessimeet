import { Button, Typography, Link } from '@heroui/react'
import { supabase } from '@/utils/supabase'
import { useNavigate } from '@tanstack/react-router'

interface NavbarProps {
    isLoggedIn: boolean
}

export const Navbar = (props: NavbarProps) => {
    const navigate = useNavigate();

    const logOut = async () => {
        const { error } = await supabase.auth.signOut()
    }

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
            <div className="flex-1 flex justify-start">
                <Link href="/" className="no-underline">
                    <Typography type="h1">ACCESSIMEET</Typography>
                </Link>
            </div>

            {props.isLoggedIn ? (
                <>
                    {/* <div className="flex-1 flex justify-center gap-3">
                        <Link href="/" className="no-underline">
                            <Typography type="h4" className="font-thin">
                                Create Room
                            </Typography>
                        </Link>
                        <Link href="/" className="no-underline">
                            <Typography type="h4" className="font-thin">
                                Join Room
                            </Typography>
                        </Link>
                    </div> */} {/* redundant for now as home page alr has it */}

                    <div className="flex-1 flex justify-end">
                        <Button className="bg-red-500 text-black font-semibold" onPress={logOut}>Sign Out</Button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex-1" />
                    <div className="flex-1 flex justify-end">
                        <Button onPress={() =>navigate({ to: '/auth' })}>Sign Up</Button>
                    </div>
                </>
            )}

        </div>
    )
}
