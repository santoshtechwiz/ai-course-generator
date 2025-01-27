import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"
import HelpSection from "@/app/components/HelpSection"

interface HelpModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onOpenChange }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <HelpCircle className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] sm:mx-auto sm:my-20">
                <DialogHeader>
                    <DialogTitle>Help on Answer Matching</DialogTitle>
                </DialogHeader>
                <HelpSection />
            </DialogContent>
        </Dialog>
    )
}
