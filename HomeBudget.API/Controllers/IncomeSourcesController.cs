using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IncomeSourcesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IncomeSourcesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<IncomeSource>>> GetAll()
        {
            var sources = await _context.IncomeSources
                .AsNoTracking()
                .OrderBy(s => s.Name)
                .ToListAsync();

            return Ok(sources);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<IncomeSource>> GetById(int id)
        {
            var source = await _context.IncomeSources
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (source == null)
            {
                return NotFound(new
                {
                    message = "Income source not found."
                });
            }

            return Ok(source);
        }

        [HttpPost]
        public async Task<ActionResult<IncomeSource>> Create(
            IncomeSourceCreateDto dto)
        {
            var name = dto.Name.Trim();

            var exists = await _context.IncomeSources
                .AnyAsync(s => s.Name == name);

            if (exists)
            {
                return Conflict(new
                {
                    message = "An income source with this name already exists."
                });
            }

            var source = new IncomeSource
            {
                Name = name,
                Description = dto.Description?.Trim()
            };

            _context.IncomeSources.Add(source);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = source.Id },
                source);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(
            int id,
            IncomeSourceUpdateDto dto)
        {
            var source = await _context.IncomeSources.FindAsync(id);

            if (source == null)
            {
                return NotFound(new
                {
                    message = "Income source not found."
                });
            }

            var name = dto.Name.Trim();

            var exists = await _context.IncomeSources
                .AnyAsync(s => s.Name == name && s.Id != id);

            if (exists)
            {
                return Conflict(new
                {
                    message = "An income source with this name already exists."
                });
            }

            source.Name = name;
            source.Description = dto.Description?.Trim();
            source.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}