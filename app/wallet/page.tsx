"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWallet } from "@/lib/wallet-context"
import { mockTransactions } from "@/lib/mock-data"
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, CheckCircle2, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { useFlowBalance, useUserNFTs } from "@/lib/flow/hooks"
import { toast } from "sonner"

export default function WalletPage() {
  const { isConnected, user, address } = useWallet()
  const [copied, setCopied] = useState(false)
  const [sendAmount, setSendAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isSending, setIsSending] = useState(false)

  const { balance, loading: balanceLoading } = useFlowBalance()
  const { nfts } = useUserNFTs()

  if (!isConnected || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center py-16">
              <Wallet className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-8">
                You need to connect your wallet to view your balance and transactions
              </p>
              <Button size="lg">Connect Wallet</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(address || user.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast.error("Wallet not connected")
      return
    }

    setIsSending(true)

    try {
      // This would use Flow SDK to send FLOW tokens
      // For now, show a message
      toast.info("Flow token transfer coming soon. Use Flow wallet for now.")
      setSendAmount("")
      setRecipientAddress("")
    } catch (error) {
      console.error("[v0] Send error:", error)
      toast.error("Failed to send FLOW tokens")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Your Wallet</h1>
              <p className="text-lg text-muted-foreground text-balance">Manage your Flow tokens and transactions</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Balance Card */}
              <Card className="lg:col-span-2 border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Wallet Balance
                  </CardTitle>
                  <CardDescription>Your Flow blockchain wallet</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      {balanceLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <p className="text-muted-foreground">Loading balance...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-5xl font-bold mb-2">{balance} FLOW</p>
                          <p className="text-sm text-muted-foreground">
                            ≈ ${(Number.parseFloat(balance) * 0.75).toFixed(2)} USD
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="text-xs flex-1 truncate">{address || user.address}</code>
                      <Button variant="ghost" size="sm" onClick={copyAddress}>
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1">
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                      <Button variant="outline" className="flex-1 bg-transparent">
                        <ArrowDownLeft className="w-4 h-4 mr-2" />
                        Receive
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Total NFTs</p>
                    <p className="text-3xl font-bold">{nfts.length}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-2">Total Transactions</p>
                    <p className="text-3xl font-bold">{mockTransactions.length}</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="transactions">
              <TabsList className="w-full justify-start mb-6">
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="send">Send</TabsTrigger>
                <TabsTrigger value="receive">Receive</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest wallet activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mockTransactions.length > 0 ? (
                      <div className="space-y-4">
                        {mockTransactions.map((tx) => {
                          const isSent = tx.from.id === user.id
                          return (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isSent ? "bg-red-500/10" : "bg-green-500/10"
                                  }`}
                                >
                                  {isSent ? (
                                    <ArrowUpRight className="w-5 h-5 text-red-500" />
                                  ) : (
                                    <ArrowDownLeft className="w-5 h-5 text-green-500" />
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium">{tx.nft.name}</p>
                                    <Badge variant="secondary" className="capitalize">
                                      {tx.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {isSent ? `To @${tx.to.username}` : `From @${tx.from.username}`}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                {tx.price && (
                                  <p className={`font-bold mb-1 ${isSent ? "text-red-500" : "text-green-500"}`}>
                                    {isSent ? "-" : "+"}
                                    {tx.price} {tx.currency}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No transactions yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="send">
                <Card>
                  <CardHeader>
                    <CardTitle>Send FLOW</CardTitle>
                    <CardDescription>Transfer FLOW tokens to another wallet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSend} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="recipient">Recipient Address</Label>
                        <Input
                          id="recipient"
                          placeholder="0x..."
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (FLOW)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          max={Number.parseFloat(balance)}
                          placeholder="0.00"
                          value={sendAmount}
                          onChange={(e) => setSendAmount(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">Available: {balance} FLOW</p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Amount</span>
                          <span className="font-medium">{sendAmount || "0.00"} FLOW</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Network Fee</span>
                          <span className="font-medium">0.001 FLOW</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-border">
                          <span className="font-medium">Total</span>
                          <span className="font-bold">
                            {sendAmount ? (Number.parseFloat(sendAmount) + 0.001).toFixed(3) : "0.001"} FLOW
                          </span>
                        </div>
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSending}>
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Send FLOW
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="receive">
                <Card>
                  <CardHeader>
                    <CardTitle>Receive FLOW</CardTitle>
                    <CardDescription>Share your wallet address to receive tokens</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="aspect-square max-w-xs mx-auto bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">QR Code</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Your Wallet Address</Label>
                        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                          <code className="text-sm flex-1 break-all">{address || user.address}</code>
                          <Button variant="ghost" size="sm" onClick={copyAddress}>
                            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Only send FLOW tokens to this address. Sending other tokens may result in permanent loss.
                        </p>
                      </div>

                      <Button variant="outline" className="w-full bg-transparent">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Flow Explorer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
