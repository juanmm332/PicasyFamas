using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using PicasyFamas.DataTransferObjects;
using PicasyFamas.Services;

namespace PicasyFamas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IConfiguration _configuration;

        public GameController(IGameService gameService, IConfiguration configuration)
        {
            _gameService = gameService;
            _configuration = configuration;
        }

        [HttpPost("auth/register")]
        public async Task<IActionResult> Register([FromBody] PlayerRegisterDto dto)
        {
            var player = await _gameService.RegisterPlayerAsync(dto.Firstname, dto.Lastname, dto.Age, dto.Email, dto.Password);
            if (player == null)
                return BadRequest(new { message = "El email ya se encuentra registrado." });

            return Ok(new { message = "Usuario registrado con éxito." });
        }

        [HttpPost("auth/login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var player = await _gameService.GetPlayerByEmailAsync(dto.Email);
            if (player == null || player.Password != dto.Password)
                return Unauthorized(new { message = "Credenciales incorrectas." });

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "SuperSecretKeyReglamentaria2026---");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, player.Id.ToString()),
                    new Claim(ClaimTypes.Email, player.Email)
                }),
                Expires = DateTime.UtcNow.AddDays(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { token = tokenString, message = "Login exitoso." });
        }

        [Authorize]
        [HttpPost("start")]
        public async Task<IActionResult> StartGame()
        {
            var playerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (playerIdClaim == null) return Unauthorized();

            var playerId = Guid.Parse(playerIdClaim);

            var activeGame = await _gameService.GetActiveGameByPlayerIdAsync(playerId);
            if (activeGame != null)
            {
                return BadRequest(new { message = "Ya tenés una partida activa en curso.", gameId = activeGame.Id });
            }

            var newGame = await _gameService.StartGameAsync(playerId);
            if (newGame == null) return StatusCode(500, "No se pudo iniciar el juego.");

            return Ok(new { message = "Juego iniciado. ¡Adiviná el número de 4 dígitos!", gameId = newGame.Id });
        }

        [Authorize]
        [HttpPost("guess/{gameId}")]
        public async Task<IActionResult> Guess(int gameId, [FromBody] GuessDto dto)
        {
            if (string.IsNullOrEmpty(dto.Number) || dto.Number.Length != 4)
                return BadRequest(new { message = "Debe enviar un número de exactamente 4 dígitos." });

            var game = await _gameService.GetGameByIdAsync(gameId);
            if (game == null) return NotFound(new { message = "El juego especificado no existe." });
            if (game.IsFinished) return BadRequest(new { message = "Este juego ya ha finalizado." });

            var attempt = await _gameService.ProcessGuessAsync(game, dto.Number);

            return Ok(new GameResponseDto
            {
                GameId = game.Id,
                Message = attempt.Pistas,
                IsFinished = game.IsFinished
            });
        }
    }
}