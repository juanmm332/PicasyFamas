using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PicasyFamas.Data; 
using PicasyFamas.Models;
using System.Security.Claims;

namespace PicasyFamas.Controllers
{
    [ApiController]
    public class StatsController : ControllerBase
    {
        private readonly GameDbContext _context;

        public StatsController(GameDbContext context)
        {
            _context = context;
        }

        // =======================================================
        // 1. ESTADÍSTICAS GLOBALES
        // =======================================================

        [HttpGet("api/game/v1/stats/registrations-per-day")]
        public async Task<IActionResult> GetRegistrationsPerDay()
        {
            var dates = await _context.Players.Select(p => p.CreatedAt).ToListAsync();
            var data = dates.GroupBy(d => d.Date)
                            // Mandamos 'day' y 'date' para que cualquier gráfico lo lea sin problemas
                            .Select(g => new { day = g.Key, date = g.Key, count = g.Count() })
                            .OrderBy(x => x.day)
                            .ToList();
            return Ok(data);
        }

        [HttpGet("api/game/v1/stats/games-played-per-day")]
        public async Task<IActionResult> GetGamesPlayedPerDay()
        {
            var dates = await _context.Games.Select(g => g.CreatedAt).ToListAsync();
            var data = dates.GroupBy(d => d.Date)
                            // Mandamos 'day' y 'date' para cubrir ambos nombres
                            .Select(g => new { day = g.Key, date = g.Key, count = g.Count() })
                            .OrderBy(x => x.day)
                            .ToList();
            return Ok(data);
        }

        [HttpGet("api/Metrics/dashboard")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            var topGames = await _context.Games
                .Where(g => g.IsFinished)
                .Select(g => new 
                { 
                    gameId = g.Id, 
                    playerName = g.Player.Firstname + " " + g.Player.Lastname,
                    totalAttempts = _context.Attempts.Count(a => a.GameId == g.Id)
                })
                .OrderBy(x => x.totalAttempts)
                .Take(5)
                .ToListAsync();

            var attemptsPerGame = await _context.Games
                .Where(g => g.IsFinished)
                .Select(g => new 
                { 
                    gameId = g.Id, 
                    attemptsCount = _context.Attempts.Count(a => a.GameId == g.Id) 
                })
                .ToListAsync();

            double avg = attemptsPerGame.Any() ? attemptsPerGame.Average(x => x.attemptsCount) : 0;

            var playerDates = await _context.Players.Select(p => p.CreatedAt).ToListAsync();
            var regsByDay = playerDates.GroupBy(d => d.Date)
                                       // Mandamos 'day' y 'date' para cubrir ambos nombres
                                       .Select(g => new { day = g.Key, date = g.Key, count = g.Count() })
                                       .OrderBy(x => x.day)
                                       .ToList();

            var result = new 
            {
                registrationsByDay = regsByDay, 
                top5ShortestGames = topGames,
                attemptsPerGame = attemptsPerGame,
                averageAttemptsGlobal = avg
            };

            return Ok(result);
        }

        [HttpGet("api/game/v1/stats/top5-fewest-attempts")]
        public async Task<IActionResult> GetTop5FewestAttempts()
        {
            var top = await _context.Games
                .Where(g => g.IsFinished)
                .Select(g => new 
                { 
                    PlayerName = g.Player.Firstname + " " + g.Player.Lastname, 
                    AttemptsCount = _context.Attempts.Count(a => a.GameId == g.Id), 
                    CreatedAt = g.CreatedAt 
                })
                .OrderBy(x => x.AttemptsCount)
                .Take(5)
                .ToListAsync();
                
            return Ok(top);
        }

        // =======================================================
        // 2. ESTADÍSTICAS DEL JUGADOR (Mis Estadísticas)
        // =======================================================
        
        [HttpGet("api/game/v1/stats/players/me")]
        public async Task<IActionResult> GetPlayerStats()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            var playerGuid = Guid.Parse(userIdClaim);

            var games = await _context.Games
                .Where(g => g.PlayerId == playerGuid)
                .ToListAsync();

            var wonGames = games.Where(g => g.IsFinished).ToList();

            var stats = new {
                TotalPlayed = games.Count,
                TotalWon = wonGames.Count,
                BestGame = wonGames.Any() ? wonGames.Min(g => _context.Attempts.Count(a => a.GameId == g.Id)) : 0,
                AverageAttempts = wonGames.Any() ? wonGames.Average(g => _context.Attempts.Count(a => a.GameId == g.Id)) : 0
            };

            return Ok(stats);
        }

        [HttpGet("api/game/v1/stats/daily-leaderboard")]
        public async Task<IActionResult> GetDailyLeaderboard()
        {
            var today = DateTime.Today;
            
            var leaderboard = await _context.Games
                .Where(g => g.IsFinished && g.CreatedAt.Date == today)
                .Select(g => new 
                { 
                    PlayerName = g.Player.Firstname + " " + g.Player.Lastname,
                    BestScore = _context.Attempts.Count(a => a.GameId == g.Id) 
                })
                .OrderBy(x => x.BestScore) 
                .Take(10)
                .ToListAsync();

            return Ok(leaderboard);
        }
    }
}