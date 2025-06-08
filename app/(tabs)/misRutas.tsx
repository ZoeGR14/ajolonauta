import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import geojsonData from "../../assets/data/metro.json";
import terminales from "../../assets/data/terminales.json";
import { euclidiana, lineas, orderStations } from "./mapa";

// Definición de tipos
interface Coordinate {
  latitude: number;
  longitude: number;
}

interface Station extends Coordinate {
  nombre: string;
}

interface GraphNode {
  conexiones: { nombre: string; peso: number }[];
}

// PriorityQueue optimizada
class PriorityQueue<T> {
  private collection: [T, number][] = [];

  enqueue(element: [T, number]): void {
    this.collection.push(element);
    this.collection.sort((a, b) => a[1] - b[1]);
  }

  dequeue(): [T, number] | undefined {
    return this.collection.shift();
  }

  isEmpty(): boolean {
    return this.collection.length === 0;
  }
}

// Implementación de Dijkstra
export function dijkstra(
  graph: Record<string, GraphNode>,
  startNode: string,
  endNode: string
) {
  const distances: Record<string, number> = {};
  const previousNodes: Record<string, string | null> = {};
  const priorityQueue = new PriorityQueue<string>();

  Object.keys(graph).forEach((node) => {
    distances[node] = Infinity;
    previousNodes[node] = null;
  });

  distances[startNode] = 0;
  priorityQueue.enqueue([startNode, 0]);

  while (!priorityQueue.isEmpty()) {
    const current = priorityQueue.dequeue();
    if (!current) continue;
    const [currentNode, currentDistance] = current;

    if (currentDistance > distances[currentNode]) continue;

    if (currentNode === endNode) {
      const path: string[] = [];
      let tempNode: string | null = endNode;
      while (tempNode !== null) {
        path.unshift(tempNode);
        tempNode = previousNodes[tempNode];
      }
      return { distance: distances[endNode], path };
    }

    graph[currentNode]?.conexiones.forEach(({ nombre, peso }) => {
      const distance = currentDistance + peso;
      if (distance < distances[nombre]) {
        distances[nombre] = distance;
        previousNodes[nombre] = currentNode;
        priorityQueue.enqueue([nombre, distance]);
      }
    });
  }

  return { distance: Infinity, path: null };
}

// Construcción de grafo
function construirGrafo(lineas: { estaciones: Station[] }[]) {
  const grafo: Record<string, GraphNode> = {};

  lineas.forEach(({ estaciones }) => {
    estaciones.forEach((estacion, index) => {
      if (!grafo[estacion.nombre]) {
        grafo[estacion.nombre] = { conexiones: [] };
      }

      if (index > 0) {
        const anterior = estaciones[index - 1];
        grafo[estacion.nombre].conexiones.push({
          nombre: anterior.nombre,
          peso: euclidiana(estacion, anterior),
        });
      }

      if (index < estaciones.length - 1) {
        const siguiente = estaciones[index + 1];
        grafo[estacion.nombre].conexiones.push({
          nombre: siguiente.nombre,
          peso: euclidiana(estacion, siguiente),
        });
      }
    });
  });

  return grafo;
}

export default function MisRutas() {
  const lines = useMemo(() => {
    return lineas
      .map((l) => {
        const completa = geojsonData.features.filter((lines) =>
          lines.properties.routes.includes(l)
        );

        const terminal = terminales.find((t) => t.linea === l)?.nombre;
        let coordenadaInicial: Station = {
          latitude: 0,
          longitude: 0,
          nombre: "",
        };

        const coordenadas: Station[] = completa.map((linea) => {
          const [longitude, latitude] = linea.geometry.coordinates;
          return { latitude, longitude, nombre: linea.properties.name };
        });

        if (terminal) {
          const terminalData = completa.find(
            (linea) => linea.properties.name === terminal
          );
          if (terminalData) {
            const [longitude, latitude] = terminalData.geometry.coordinates;
            coordenadaInicial = { latitude, longitude, nombre: terminal };
          }
        }

        const color = terminales.find((t) => t.linea === l)?.color || "black";

        return {
          startStation: coordenadaInicial,
          stations: coordenadas,
          color,
          linea: l,
        };
      })
      .map((p) => ({
        estaciones: orderStations(p.startStation, p.stations),
        color: p.color,
        linea: p.linea,
      }));
  }, []);
  //@ts-ignore
  const grafo = construirGrafo(lines);
  const start = "Ciudad Azteca";
  const end = "Barranca del Muerto";
  const result = dijkstra(grafo, start, end);

  if (result.path) {
    console.log(
      `La ruta más corta de ${start} a ${end} es: ${result.path.join(" -> ")}`
    );
    console.log(`Distancia total: ${result.distance}`);
  } else {
    console.log(`No se encontró una ruta de ${start} a ${end}.`);
  }

  return (
    <View style={styles.container}>
      <Text>MisRutas</Text>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
});
