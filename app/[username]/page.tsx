import { PublicProfile } from '@/components/pexiloq-app'
export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; return <PublicProfile username={username} /> }
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) { const { username } = await params; return { title: `${username} on Pexiloq`, description: `A personal home for ${username}'s links, projects, and ideas.` } }
