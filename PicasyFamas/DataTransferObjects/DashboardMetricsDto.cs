using System.Collections.Generic;

namespace PicasyFamas.DataTransferObjects
{
    // Este es el contenedor principal que dev0 va a recibir como un único JSON
    public class DashboardMetricsDto
    {
        public List<UsersByDayDto> RegistrationsByDay { get; set; } = new();
        public List<TopGameDto> Top5ShortestGames { get; set; } = new();
        public List<GameAttemptsDetailDto> AttemptsPerGame { get; set; } = new();
        public double AverageAttemptsGlobal { get; set; }
    }

    // Estructura para la Métrica 1: Gráfico de barra de registros por día
    public class UsersByDayDto
    {
        public string Day { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    // Estructura para la Métrica 2: Top 5 de ganadores rápidos
    public class TopGameDto
    {
        public int GameId { get; set; }
        public string PlayerName { get; set; } = string.Empty;
        public int TotalAttempts { get; set; }
    }

    // Estructura para la Métrica 3: Intentos por cada juego individual
    public class GameAttemptsDetailDto
    {
        public int GameId { get; set; }
        public int AttemptsCount { get; set; }
    }
}