import GenerateProgramForm from './form'

export default async function GenerateProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GenerateProgramForm clientId={id} />
}
