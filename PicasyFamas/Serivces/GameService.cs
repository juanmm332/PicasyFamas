using GameCore;
using Microsoft.EntityFrameworkCore;
using PicasyFamas.Data;
using PicasyFamas.Models;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PicasyFamas.Services
{
    public class GameService : IGameService
    {
        private readonly GameDbContext _context;

        public GameService(GameDbContext context)
        {
            _context = context;
        }

        public async Task<Player?> RegisterPlayerAsync(string firstname, string lastname, int age, string email, string password)
        {
            var existingPlayer = await _context.Players.AnyAsync(p => p.Email == email);
            if (existingPlayer) return null;

            var player = new Player
            {
                Firstname = firstname,
                Lastname = lastname,
                Age = age,
                Email = email,
                Password = password
            };

            _context.Players.Add(player);
            await _context.SaveChangesAsync();
            return player;
        }

        public async Task<Player?> GetPlayerByEmailAsync(string email)
        {
            return await _context.Players.FirstOrDefaultAsync(p => p.Email == email);
        }

        public async Task<Game?> StartGameAsync(Guid playerId)
        {
            var secret = GenerateSecretNumber();

            var game = new Game
            {
                PlayerId = playerId,
                SecretNumber = secret,
                IsFinished = false
            };

            _context.Games.Add(game);
            await _context.SaveChangesAsync();
            return game;
        }

        public async Task<Game?> GetActiveGameByPlayerIdAsync(Guid playerId)
        {
            return await _context.Games
                .FirstOrDefaultAsync(g => g.PlayerId == playerId && !g.IsFinished);
        }

        public async Task<Game?> GetGameByIdAsync(int gameId)
        {
            return await _context.Games.FirstOrDefaultAsync(g => g.Id == gameId);
        }

        public async Task<Attempt> ProcessGuessAsync(Game game, string attemptedNumberStr)
        {
            // 1. Convertimos los strings a int como pide la documentación de la foto
            //int numeroSecreto = int.Parse(game.SecretNumber);
            //int numeroIntento = int.Parse(attemptedNumberStr);

            // 2. Llamamos al método estático tal cual está en tu captura
            var resultado = Evaluator.ValidateAttempt(game.SecretNumber, attemptedNumberStr);

            // 3. Extraemos el mensaje formateado que genera la librería
            string mensajePista = resultado.Message;

            // 4. Si las Famas son iguales a 4, el juego terminó
            if (resultado.Fama == 4)
            {
                game.IsFinished = true;
                _context.Games.Update(game);
            }

            // 5. Guardamos el intento en la base de datos
            var attempt = new Attempt
            {
                GameId = game.Id,
                AttemptedNumber = int.Parse(attemptedNumberStr),
                Pistas = mensajePista
            };

            _context.Attempts.Add(attempt);
            await _context.SaveChangesAsync();

            return attempt;
        }

        private string GenerateSecretNumber()
        {
            var random = new Random();
            var digits = Enumerable.Range(0, 10).OrderBy(x => random.Next()).Take(4).ToList();
            return string.Join("", digits);
        }
    }
}