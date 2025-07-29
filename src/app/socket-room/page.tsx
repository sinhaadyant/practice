"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

const nameFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const joinRoomFormSchema = z.object({
  roomId: z.string().min(1, "Room ID is required"),
});

const page = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [playersInRoom, setPlayersInRoom] = useState<string[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);

  const nameForm = useForm<z.infer<typeof nameFormSchema>>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { name: "" },
  });

  const joinRoomForm = useForm<z.infer<typeof joinRoomFormSchema>>({
    resolver: zodResolver(joinRoomFormSchema),
    defaultValues: { roomId: "" },
  });

  const socket = useRef<Socket>(null);

  useEffect(() => {
    socket.current = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000",
      {
        transports: ["websocket"],
      }
    );
  }, []);

  // 🔁 Setup listeners
  useEffect(() => {
    socket.current?.on("players-update", (players: any[]) => {
      setPlayersInRoom(players.map((p) => p.name));
    });

    socket.current?.on("game-started", () => {
      alert("🎮 Game Started!");
    });

    return () => {
      socket.current?.off("players-update");
      socket.current?.off("game-started");
    };
  }, [socket]);

  const onSubmitName = (values: z.infer<typeof nameFormSchema>) => {
    setPlayerName(values.name);
    socket.current?.emit("player_name", values.name);
  };

  const onSubmitJoinRoom = (values: z.infer<typeof joinRoomFormSchema>) => {
    setRoomId(values.roomId);
    setIsInRoom(true);

    socket.current?.emit("join-game", {
      name: playerName,
      room: values.roomId,
    });
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Socket Room</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Player Info and Join Room */}
        <div className="space-y-6">
          {/* Player Name Form */}
          <Card>
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
              <CardDescription>Enter your name to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...nameForm}>
                <form
                  onSubmit={nameForm.handleSubmit(onSubmitName)}
                  className="space-y-4"
                >
                  <FormField
                    control={nameForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Set Name
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Join Room Form */}
          <Card>
            <CardHeader>
              <CardTitle>Join Room</CardTitle>
              <CardDescription>
                Enter a room ID to join an existing room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...joinRoomForm}>
                <form
                  onSubmit={joinRoomForm.handleSubmit(onSubmitJoinRoom)}
                  className="space-y-4"
                >
                  <FormField
                    control={joinRoomForm.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter room ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Join Room
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Rooms List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Available Rooms</h2>
            <Button variant="outline" size="sm">
              Refresh
            </Button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {playersInRoom.length > 0 &&
              playersInRoom
                .filter((player) => player !== playerName)
                .map((player) => (
                  <Card
                    key={player}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{player}</CardTitle>
                    </CardHeader>
                  </Card>
                ))}
            {playersInRoom.length === 0 && (
              <p className="text-center text-gray-500">No players in room</p>
            )}
            {Array(10)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Room #{123 + index}
                      </CardTitle>
                      <Badge variant="secondary">
                        {Math.floor(Math.random() * 4) + 1}/4 Players
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Player 1</Badge>
                      <Badge variant="outline">Player 2</Badge>
                      {Math.random() > 0.5 && (
                        <Badge variant="outline">Player 3</Badge>
                      )}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        Leave
                      </Button>
                      <Button size="sm" className="flex-1">
                        Start Game
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
