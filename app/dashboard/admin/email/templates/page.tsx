import { EmailTemplateEditor } from "../../components/admin/email-template-editor";

export default function EmailTemplatesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Email Templates</h1>
      <EmailTemplateEditor />
    </div>
  )
}

