type ActivityData = {
    action: string;
    entityType: string;
    entityId: string;
    metadata?: string
  };
  
  export async function logActivity(data: ActivityData) {
    try {
      const response = await fetch('/api/log-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        throw new Error('Failed to log activity');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }
  
  