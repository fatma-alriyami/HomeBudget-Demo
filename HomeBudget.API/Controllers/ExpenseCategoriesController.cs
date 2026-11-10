using HomeBudget.API.Data;
using HomeBudget.API.DTOs;
using HomeBudget.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HomeBudget.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExpenseCategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExpenseCategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<ExpenseCategory>>> GetAll()
        {
            var categories = await _context.ExpenseCategories
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ExpenseCategory>> GetById(int id)
        {
            var category = await _context.ExpenseCategories
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Expense category not found."
                });
            }

            return Ok(category);
        }

        [HttpPost]
        public async Task<ActionResult<ExpenseCategory>> Create(
            ExpenseCategoryCreateDto dto)
        {
            var name = dto.Name.Trim();

            var exists = await _context.ExpenseCategories
                .AnyAsync(c => c.Name == name);

            if (exists)
            {
                return Conflict(new
                {
                    message = "An expense category with this name already exists."
                });
            }

            var category = new ExpenseCategory
            {
                Name = name,
                Description = dto.Description?.Trim()
            };

            _context.ExpenseCategories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { id = category.Id },
                category);
        }

        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status409Conflict)]
        public async Task<IActionResult> Update(
            int id,
            ExpenseCategoryUpdateDto dto)
        {
            var category = await _context.ExpenseCategories.FindAsync(id);

            if (category == null)
            {
                return NotFound(new
                {
                    message = "Expense category not found."
                });
            }

            var name = dto.Name.Trim();

            var exists = await _context.ExpenseCategories
                .AnyAsync(c => c.Name == name && c.Id != id);

            if (exists)
            {
                return Conflict(new
                {
                    message = "An expense category with this name already exists."
                });
            }

            category.Name = name;
            category.Description = dto.Description?.Trim();
            category.IsActive = dto.IsActive;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}