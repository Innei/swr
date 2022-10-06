type Subscription = (value: any) => void
export class SubscriptionStatic {
  private subscribers: Map<string, Set<Subscription>> = new Map()
  on = (event: string, callback: Subscription) => {
    const subscribers = this.subscribers.get(event) || new Set()
    subscribers.add(callback)
    this.subscribers.set(event, subscribers)
    return () => {
      subscribers.delete(callback)
    }
  }
  off = (event: string, callback: Subscription) => {
    const subscribers = this.subscribers.get(event)
    if (subscribers) {
      subscribers.delete(callback)
    }
  }
  emit = (event: string, value: any) => {
    const subscribers = this.subscribers.get(event)
    if (subscribers) {
      subscribers.forEach((callback) => {
        callback(value)
      })
    }
  }
}

export const subscription = new SubscriptionStatic()
