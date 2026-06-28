using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PicasyFamas.Data;
using PicasyFamas.DataTransferObjects;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PicasyFamas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MetricsController : ControllerBase
    {
        // ⚠️ ATENCIÓN: Reemplazá 'MyDbContext' por el nombre exacto de tu clase de contexto (ej. AppDbContext, GameDbContext, etc.)
        private readonly GameDbContext _context;
        private readonly ILogger<MetricsController> _logger;

        public MetricsController(GameDbContext context, ILogger<MetricsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            // CUMPLIMIENTO DEL PDF: Registro de log de auditoría en la consola/servidor
            _logger.LogInformation("AUDITORÍA DE ACCESO: Se solicitaron las métricas consolidadas para el Dashboard.");

            try
            {
                // MÉTRICA 1: Cantidad de usuarios registrados por día
                // NOTA: Como el modelo Player básico que armamos no guardaba fecha de creación nativa, 
                // hacemos un truco de LinQ para agrupar los que existen bajo la etiqueta "Usuarios Activos".
                // (Si tenés un campo de fecha tipo 'CreatedAt' en tu tabla de Players, podés cambiarlo por p.CreatedAt.ToShortDateString())
                var regsByDay = await _context.Players
                    .GroupBy(p => 1)
                    .Select(g => new UsersByDayDto
                    {
                        Day = "Total Registrados",
                        Count = g.Count()
                    })
                    .ToListAsync();

                // MÉTRICA 3 (Parte A): Cantidad de intentos por cada juego
                // Buscamos todos los juegos de la base de datos y contamos cuántos intentos asociados tiene cada uno en la tabla Attempts
                var gamesWithAttempts = await _context.Games
                    .Select(g => new GameAttemptsDetailDto
                    {
                        GameId = g.Id,
                        AttemptsCount = _context.Attempts.Count(a => a.GameId == g.Id)
                    }).ToListAsync();

                // MÉTRICA 3 (Parte B): Calcular el promedio global de todos los juegos combinados
                double average = gamesWithAttempts.Any() ? gamesWithAttempts.Average(x => x.AttemptsCount) : 0;

                // MÉTRICA 2: Top 5 de los juegos con MENOR intento de adivinanza (los más eficientes)
                // Filtramos solo los que terminaron (IsFinished == true), los ordenamos de menor a mayor cantidad de intentos y tomamos los primeros 5
                var top5 = await _context.Games
                    .Where(g => g.IsFinished)
                    .Select(g => new TopGameDto
                    {
                        GameId = g.Id,
                        // Buscamos el nombre del jugador haciendo match con el PlayerId
                        PlayerName = _context.Players.Where(p => p.Id == g.PlayerId).Select(p => p.Firstname).FirstOrDefault() ?? "Jugador",
                        TotalAttempts = _context.Attempts.Count(a => a.GameId == g.Id)
                    })
                    .OrderBy(g => g.TotalAttempts) // Menor cantidad de intentos primero
                    .Take(5)
                    .ToListAsync();

                // Consolidamos todas las respuestas dentro de nuestro DTO principal
                var metricsResponse = new DashboardMetricsDto
                {
                    RegistrationsByDay = regsByDay,
                    Top5ShortestGames = top5,
                    AttemptsPerGame = gamesWithAttempts,
                    AverageAttemptsGlobal = Math.Round(average, 2) // Redondeado a 2 decimales para que quede prolijo
                };

                return Ok(metricsResponse);
            }
            catch (Exception ex)
            {
                // CUMPLIMIENTO DEL PDF: Registro de log de error en auditoría si algo falla con la base de datos
                _logger.LogError($"AUDITORÍA DE ERROR: Falló la extracción de métricas. Detalles: {ex.Message}");
                return StatusCode(500, "Error interno del servidor al procesar las métricas de auditoría.");
            }
        }
    }
}