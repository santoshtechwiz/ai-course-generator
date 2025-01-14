import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CreditsProps {
  credits: number
}

export default function Credits({ credits }: CreditsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold">{credits}</div>
        <CardDescription>Available credits</CardDescription>
      </CardContent>
    </Card>
  )
}

